import config from "@/config";

import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { type Address, isAddressEqual, zeroAddress } from "viem";

import {
  ADDR_REVERSE_NODE,
  getENSRootChainId,
  getRootRegistry,
  getRootRegistryId,
  type LabelHash,
  makeENSv1DomainId,
  makeSubdomainNode,
  type Node,
  PluginName,
  ROOT_NODE,
} from "@ensnode/ensnode-sdk";

import { materializeENSv1DomainOwner } from "@/lib/ensv2/domain-db-helpers";
import { ensureLabel, ensureUnknownLabel } from "@/lib/ensv2/label-db-helpers";
import { healAddrReverseSubnameLabel } from "@/lib/heal-addr-reverse-subname-label";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";
import { nodeIsMigrated } from "@/lib/protocol-acceleration/registry-migration-status";

const pluginName = PluginName.ENSv2;

/**
 * Handler functions for ENSv1 Regsitry contracts.
 * - piggybacks Protocol Resolution plugin's Node Migration status
 */
export default function () {
  /**
   * Sets up the ENSv2 Root Registry
   */
  ponder.on(namespaceContract(pluginName, "ENSv1RegistryOld:setup"), async ({ context }) => {
    // ensures that the Root Registry (which is eventually backed by the ENSv2 Root Registry) is
    // populated in the database
    await context.db.insert(schema.registry).values({
      id: getRootRegistryId(config.namespace),
      type: "RegistryContract",
      ...getRootRegistry(config.namespace),
    });
  });

  /**
   * Registry#NewOwner is either a new Domain OR the owner of the parent changing the owner of the child.
   */
  async function handleNewOwner({
    context,
    event,
  }: {
    context: Context;
    event: EventWithArgs<{
      // NOTE: `node` event arg represents a `Node` that is the _parent_ of the node the NewOwner event is about
      node: Node;
      // NOTE: `label` event arg represents a `LabelHash` for the sub-node under `node`
      label: LabelHash;
      owner: Address;
    }>;
  }) {
    const { label: labelHash, node: parentNode, owner } = event.args;

    // if someone mints a node to the zero address, nothing happens in the Registry, so no-op
    if (isAddressEqual(zeroAddress, owner)) return;

    const node = makeSubdomainNode(labelHash, parentNode);
    const domainId = makeENSv1DomainId(node);
    const parentId = makeENSv1DomainId(parentNode);

    // If this is a direct subname of addr.reverse, we have 100% on-chain label discovery.
    //
    // Note: Per ENSIP-19, only the ENS Root chain may record primary names under the `addr.reverse`
    // subname. Also per ENSIP-19 no Reverse Names need exist in (shadow)Registries on non-root
    // chains, so we explicitly only support Root chain addr.reverse-based Reverse Names: ENSIP-19
    // CoinType-specific Reverse Names (ex: [address].[coinType].reverse) don't actually exist in
    // the ENS Registry: wildcard resolution is used, so this NewOwner event will never be emitted
    // with a domain created as a child of a Coin-Type specific Reverse Node (ex: [coinType].reverse).
    if (
      parentNode === ADDR_REVERSE_NODE &&
      context.chain.id === getENSRootChainId(config.namespace)
    ) {
      const label = await healAddrReverseSubnameLabel(context, event, labelHash);
      await ensureLabel(context, label);
    } else {
      await ensureUnknownLabel(context, labelHash);
    }

    // upsert domain
    await context.db
      .insert(schema.v1Domain)
      .values({
        id: domainId,
        parentId,
        labelHash,
      })
      .onConflictDoNothing();

    // materialize domain owner
    // NOTE: despite Domain.ownerId being materialized from other sources of truth (i.e. Registrars
    // like BaseRegistrars & NameWrapper) it's ok to always set it here because the Registrar-emitted
    // events occur _after_ the Registry events. So when a name is registered, for example, the Registry's
    // owner changes to that of the NameWrapper but then the NameWrapper emits NameWrapped, and this
    // indexing code re-materializes the Domain.ownerId to the NameWraper-emitted value.
    await materializeENSv1DomainOwner(context, domainId, owner);
  }

  async function handleTransfer({
    context,
    event,
  }: {
    context: Context;
    event: EventWithArgs<{ node: Node; owner: Address }>;
  }) {
    const { node, owner } = event.args;

    // ENSv2 model does not include root node, no-op
    if (node === ROOT_NODE) return;

    const domainId = makeENSv1DomainId(node);

    const isDeletion = isAddressEqual(zeroAddress, owner);
    if (isDeletion) {
      await context.db.delete(schema.v1Domain, { id: domainId });
      return;
    }

    // materialize domain owner
    // NOTE: despite Domain.ownerId being materialized from other sources of truth (i.e. Registrars
    // like BaseRegistrars & NameWrapper) it's ok to always set it here because the Registrar-emitted
    // events occur _after_ the Registry events. So when a name is wrapped, for example, the Registry's
    // owner changes to that of the NameWrapper but then the NameWrapper emits NameWrapped, and this
    // indexing code re-materializes the Domain.ownerId to the NameWraper-emitted value.
    await materializeENSv1DomainOwner(context, domainId, owner);
  }

  /**
   * Handles Registry#NewOwner for:
   * - ENS Root Chain's ENSv1RegistryOld
   */
  ponder.on(
    namespaceContract(pluginName, "ENSv1RegistryOld:NewOwner"),
    async ({ context, event }) => {
      const { label: labelHash, node: parentNode } = event.args;

      // ignore the event on ENSv1RegistryOld if node is migrated to new Registry
      const node = makeSubdomainNode(labelHash, parentNode);
      const shouldIgnoreEvent = await nodeIsMigrated(context, node);
      if (shouldIgnoreEvent) return;

      return handleNewOwner({ context, event });
    },
  );

  /**
   * Handles Registry#Transfer for:
   * - ENS Root Chain's ENSv1RegistryOld
   */
  ponder.on(
    namespaceContract(pluginName, "ENSv1RegistryOld:Transfer"),
    async ({ context, event }) => {
      const shouldIgnoreEvent = await nodeIsMigrated(context, event.args.node);
      if (shouldIgnoreEvent) return;

      return handleTransfer({ context, event });
    },
  );

  /**
   * Handles Registry events for:
   * - ENS Root Chain's (new) Registry
   * - Basenames Registry
   * - Lineanames Registry
   */
  ponder.on(namespaceContract(pluginName, "ENSv1Registry:NewOwner"), handleNewOwner);
  ponder.on(namespaceContract(pluginName, "ENSv1Registry:Transfer"), handleTransfer);
}
