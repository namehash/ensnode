import { makeENSv1DomainId, type Node, type NormalizedAddress } from "enssdk";

import { PluginName } from "@ensnode/ensnode-sdk";

import { getThisAccountId } from "@/lib/get-this-account-id";
import { addOnchainEventListener, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";
import { getManagedName } from "@/lib/managed-names";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";
import { ensureDomainResolverRelation } from "@/lib/protocol-acceleration/domain-resolver-relationship-db-helpers";
import { nodeIsMigrated } from "@/lib/protocol-acceleration/migrated-node-db-helpers";

/**
 * Handler functions for Registry contracts in the Protocol Acceleration plugin.
 * - indexes Node-Resolver Relationships for all Registry contracts
 *
 * Note: ENS Root Chain Registry node-migration status is tracked separately in `node-migration.ts`,
 * registered before both this plugin and the ENSv2 plugin so its results are available to the
 * Old-registry guards in either plugin.
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
