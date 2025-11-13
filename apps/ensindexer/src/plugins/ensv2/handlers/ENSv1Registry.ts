import config from "@/config";

import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { type Address, isAddressEqual, zeroAddress, zeroHash } from "viem";

import {
  getRootRegistry,
  getRootRegistryId,
  type LabelHash,
  makeENSv1DomainId,
  makeImplicitRegistryId,
  makeResolverId,
  makeSubdomainNode,
  type Node,
  PluginName,
} from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";
import { materializeDomainOwner } from "@/lib/ensv2/domain-db-helpers";
import { ensureUnknownLabel } from "@/lib/ensv2/label-db-helpers";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";
import { nodeIsMigrated } from "@/lib/protocol-acceleration/registry-migration-status";

const pluginName = PluginName.ENSv2;

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

  // this is either a NEW Domain OR the owner of the parent changing the owner of the child

  const node = makeSubdomainNode(labelHash, parentNode);
  const domainId = makeENSv1DomainId(node);
  const registryId =
    parentNode === zeroHash
      ? getRootRegistryId(config.namespace)
      : makeImplicitRegistryId(parentNode);

  // TODO: import label healing logic from subgraph plugin

  await ensureUnknownLabel(context, labelHash);
  await context.db
    .insert(schema.domain)
    .values({
      id: domainId,
      labelHash,
      registryId,
    })
    .onConflictDoNothing();

  // materialize domain owner
  // NOTE: despite Domain.ownerId being materialized from other sources of truth (i.e. Registrars
  // like BaseRegistrars & NameWrapper) it's ok to always set it here because the Registrar-emitted
  // events occur _after_ the Registry events. So when a name is wrapped, for example, the Registry's
  // owner changes to that of the NameWrapper but then the NameWrapper emits NameWrapped, and this
  // indexing code re-materializes the Domain.ownerId to the NameWraper-emitted value.
  await materializeDomainOwner(context, domainId, owner);
}

async function handleNewResolver({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; resolver: Address }>;
}) {
  const { node, resolver: address } = event.args;

  const domainId = makeENSv1DomainId(node);

  // update domain's resolver
  const isDeletion = isAddressEqual(address, zeroAddress);
  if (isDeletion) {
    await context.db.update(schema.domain, { id: domainId }).set({ resolverId: null });
  } else {
    const resolverId = makeResolverId({ chainId: context.chain.id, address: address });
    await context.db.update(schema.domain, { id: domainId }).set({ resolverId });
  }
}

export async function handleTransfer({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; owner: Address }>;
}) {
  const { node, owner } = event.args;

  // ENSv2 model does not include root node, no-op
  if (node === zeroHash) return;

  const domainId = makeENSv1DomainId(node);

  const isDeletion = isAddressEqual(zeroAddress, owner);
  if (isDeletion) {
    await context.db.delete(schema.domain, { id: domainId });
    return;
  }

  // TODO: if owner is special registrar, ignore

  // ensure owner account
  await ensureAccount(context, owner);

  // update owner
  await context.db.update(schema.domain, { id: domainId }).set({ ownerId: owner });
}

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
    await context.db
      .insert(schema.registry)
      .values({
        id: getRootRegistryId(config.namespace),
        type: "RegistryContract",
        ...getRootRegistry(config.namespace),
      })
      .onConflictDoNothing();
  });

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
   * Handles Registry#NewResolver for:
   * - ENS Root Chain's ENSv1RegistryOld
   */
  ponder.on(
    namespaceContract(pluginName, "ENSv1RegistryOld:NewResolver"),
    async ({ context, event }) => {
      // ignore the event on ENSv1RegistryOld if node is migrated to new Registry
      const shouldIgnoreEvent = await nodeIsMigrated(context, event.args.node);
      if (shouldIgnoreEvent) return;

      return handleNewResolver({ context, event });
    },
  );

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
  ponder.on(namespaceContract(pluginName, "ENSv1Registry:NewResolver"), handleNewResolver);
  ponder.on(namespaceContract(pluginName, "ENSv1Registry:Transfer"), handleTransfer);
}
