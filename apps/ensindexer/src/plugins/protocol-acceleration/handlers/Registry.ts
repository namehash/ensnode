import config from "@/config";

import { Context, ponder } from "ponder:registry";
import { Address, isAddressEqual, zeroAddress } from "viem";

import { getENSRootChainId } from "@ensnode/datasources";
import { LabelHash, Node, PluginName, makeSubdomainNode } from "@ensnode/ensnode-sdk";

import { namespaceContract } from "@/lib/plugin-helpers";
import { EventWithArgs } from "@/lib/ponder-helpers";
import {
  removeDomainResolverRelation,
  upsertDomainResolverRelation,
} from "@/lib/protocol-acceleration/node-resolver-relationship-db-helpers";
import { migrateNode, nodeIsMigrated } from "@/lib/protocol-acceleration/registry-migration-status";

const ensRootChainId = getENSRootChainId(config.namespace);

async function handleNewResolver({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; resolver: Address }>;
}) {
  const { node, resolver: resolverAddress } = event.args;
  const isZeroResolver = isAddressEqual(zeroAddress, resolverAddress);

  if (isZeroResolver) {
    await removeDomainResolverRelation(context, node);
  } else {
    await upsertDomainResolverRelation(context, node, resolverAddress);
  }
}

/**
 * Handler functions for Regsitry contracts in the Protocol Acceleration plugin.
 * - indexes ENS Root Chain Registry migration status
 * - indexes Node-Resolver Relationships for all Registry contracts
 *
 * Note that this registry migration status tracking is isolated to the protocol
 */
export default function () {
  /**
   * Handles Registry#NewOwner for:
   * - ENS Root Chain's (new) Registry
   */
  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "Registry:NewOwner"),
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
   * - ENS Root Chain's RegistryOld
   */
  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "RegistryOld:NewResolver"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; resolver: Address }>;
    }) => {
      // ignore the event on RegistryOld if node is migrated to new Registry
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
    namespaceContract(PluginName.ProtocolAcceleration, "Registry:NewResolver"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; resolver: Address }>;
    }) => {
      await handleNewResolver({ context, event });
    },
  );
}
