import config from "@/config";

import type { Node } from "enssdk";

import { getENSRootChainId } from "@ensnode/datasources";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

const ensRootChainId = getENSRootChainId(config.namespace);

/**
 * Process-local cache of node migration status.
 *
 * `nodeIsMigrated` is called as a precondition on every ENSv1RegistryOld event handler (NewOwner,
 * Transfer, NewTTL, NewResolver) plus PA's registry handler. At scale that is millions of PK
 * lookups against `migratedNode` over a backfill. The underlying state is process-stable because
 * `migratedNode` is append-only (once inserted, always present) and all writes go through
 * `migrateNode` below, which updates the cache in lockstep.
 *
 * Safety:
 * - Restart-safe: both sets repopulate via DB reads on cache miss after a restart.
 * - Correctness: `migrateNode` adds to `migratedNodes` and removes from `nonMigratedNodes` so a
 *   cached "not migrated" result is invalidated when migration happens within the same process.
 */
const migratedNodes = new Set<Node>();
const nonMigratedNodes = new Set<Node>();

/**
 * Returns whether the `node` has migrated to the new Registry contract.
 */
export async function nodeIsMigrated(context: IndexingEngineContext, node: Node) {
  if (context.chain.id !== ensRootChainId) {
    throw new Error(
      `Invariant(nodeIsMigrated): Node migration status is only relevant on the ENS Root Chain, and this function was called in the context of ${context.chain.id}.`,
    );
  }

  if (migratedNodes.has(node)) return true;
  if (nonMigratedNodes.has(node)) return false;

  const record = await context.ensDb.find(ensIndexerSchema.migratedNode, { node });
  if (record) {
    migratedNodes.add(node);
    return true;
  }
  nonMigratedNodes.add(node);
  return false;
}

/**
 * Record that the `node` has migrated to the new Registry contract.
 */
export async function migrateNode(context: IndexingEngineContext, node: Node) {
  if (context.chain.id !== ensRootChainId) {
    throw new Error(
      `Invariant(migrateNode): Node migration status is only relevant on the ENS Root Chain, and this function was called in the context of ${context.chain.id}.`,
    );
  }

  await context.ensDb.insert(ensIndexerSchema.migratedNode).values({ node }).onConflictDoNothing();
  migratedNodes.add(node);
  nonMigratedNodes.delete(node);
}
