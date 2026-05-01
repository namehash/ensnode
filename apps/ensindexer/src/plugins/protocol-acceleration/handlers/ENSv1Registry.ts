import config from "@/config";

import { type LabelHash, makeENSv1DomainId, type Node, type NormalizedAddress } from "enssdk";

import { getENSRootChainId } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

import { getThisAccountId } from "@/lib/get-this-account-id";
import { addOnchainEventListener, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";
import { getManagedName } from "@/lib/managed-names";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";
import { ensureDomainResolverRelation } from "@/lib/protocol-acceleration/domain-resolver-relationship-db-helpers";
import { migrateNode, nodeIsMigrated } from "@/lib/protocol-acceleration/migrated-node-db-helpers";

const ensRootChainId = getENSRootChainId(config.namespace);

/**
 * Handler functions for Registry contracts in the Protocol Acceleration plugin.
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
    context: IndexingEngineContext;
    event: EventWithArgs<{ node: Node; resolver: NormalizedAddress }>;
  }) {
    const { node, resolver } = event.args;

    // Canonicalize to the concrete ENSv1 Registry that governs this contract's namegraph
    // (ENSv1Registry vs. ENSv1RegistryOld both canonicalize to the new Registry on mainnet).
    const { registry } = getManagedName(getThisAccountId(context, event));
    const domainId = makeENSv1DomainId(registry, node);

    await ensureDomainResolverRelation(context, registry, domainId, resolver);
  }

  /**
   * Handles Registry#NewOwner for:
   * - ENS Root Chain's (new) Registry
   */
  addOnchainEventListener(
    namespaceContract(PluginName.ProtocolAcceleration, "ENSv1Registry:NewOwner"),
    async ({
      context,
      event,
    }: {
      context: IndexingEngineContext;
      event: EventWithArgs<{
        // NOTE: `node` event arg represents a `Node` that is the _parent_ of the node the NewOwner event is about
        node: Node;
        // NOTE: `label` event arg represents a `LabelHash` for the sub-node under `node`
        label: LabelHash;
        owner: NormalizedAddress;
      }>;
    }) => {
      // no-op because we only track registry migration status on ENS Root Chain
      if (context.chain.id !== ensRootChainId) return;

      const { label: labelHash, node: parentNode } = event.args;
      await migrateNode(context, parentNode, labelHash);
    },
  );

  /**
   * Handles Registry#NewResolver for:
   * - ENS Root Chain's ENSv1RegistryOld
   */
  addOnchainEventListener(
    namespaceContract(PluginName.ProtocolAcceleration, "ENSv1RegistryOld:NewResolver"),
    async ({
      context,
      event,
    }: {
      context: IndexingEngineContext;
      event: EventWithArgs<{ node: Node; resolver: NormalizedAddress }>;
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
  addOnchainEventListener(
    namespaceContract(PluginName.ProtocolAcceleration, "ENSv1Registry:NewResolver"),
    handleNewResolver,
  );
}
