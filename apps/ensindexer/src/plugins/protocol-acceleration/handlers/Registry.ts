import config from "@/config";

import { type Context, ponder } from "ponder:registry";
import { type Address, isAddressEqual, zeroAddress } from "viem";

import { getENSRootChainId } from "@ensnode/datasources";
import {
  type ENSv1DomainId,
  type LabelHash,
  makeENSv1DomainId,
  makeResolverId,
  makeSubdomainNode,
  type Node,
  PluginName,
} from "@ensnode/ensnode-sdk";

import { getThisAccountId } from "@/lib/get-this-account-id";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";
import {
  removedomainResolverRelation,
  upsertdomainResolverRelation,
} from "@/lib/protocol-acceleration/node-resolver-relationship-db-helpers";
import { migrateNode, nodeIsMigrated } from "@/lib/protocol-acceleration/registry-migration-status";

const ensRootChainId = getENSRootChainId(config.namespace);

/**
 * Handler functions for Regsitry contracts in the Protocol Acceleration plugin.
 * - indexes ENS Root Chain Registry migration status
 * - indexes Node-Resolver Relationships for all Registry contracts
 *
 * Note that this registry migration status tracking is isolated to the protocol
 */
export default function () {
  async function handleNewResolver({
    context,
    event,
  }: {
    context: Context;
    event: EventWithArgs<{ node: Node; resolver: Address }>;
  }) {
    const { node, resolver } = event.args;

    const registry = getThisAccountId(context, event);
    const domainId = makeENSv1DomainId(node);

    const isZeroResolver = isAddressEqual(zeroAddress, resolver);
    if (isZeroResolver) {
      await removedomainResolverRelation(context, registry, domainId);
    } else {
      const resolverId = makeResolverId({ chainId: registry.chainId, address: resolver });
      await upsertdomainResolverRelation(context, registry, domainId, resolverId);
    }
  }

  /**
   * Handles Registry#NewOwner for:
   * - ENS Root Chain's (new) Registry
   */
  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "ENSv1Registry:NewOwner"),
    async ({
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
    }) => {
      // no-op because we only track registry migration status on ENS Root Chain
      if (context.chain.id !== ensRootChainId) return;

      const { label: labelHash, node: parentNode } = event.args;
      const node = makeSubdomainNode(labelHash, parentNode);
      await migrateNode(context, node);
    },
  );

  /**
   * Handles Registry#NewResolver for:
   * - ENS Root Chain's ENSv1RegistryOld
   */
  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "ENSv1RegistryOld:NewResolver"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; resolver: Address }>;
    }) => {
      // ignore the event on ENSv1RegistryOld if node is migrated to new Registry
      const shouldIgnoreEvent = await nodeIsMigrated(context, event.args.node);
      if (shouldIgnoreEvent) return;

      await handleNewResolver({ context, event });
    },
  );

  /**
   * Handles Registry#NewResolver for:
   * - ENS Root Chain's (new) Registry
   * - Basename's (shadow) Registry
   * - Lineanames's (shadow) Registry
   */
  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "ENSv1Registry:NewResolver"),
    handleNewResolver,
  );
}
