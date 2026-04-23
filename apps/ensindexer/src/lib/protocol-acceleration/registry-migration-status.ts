import config from "@/config";

import type { Node } from "enssdk";

import { getENSRootChainId } from "@ensnode/datasources";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

const ensRootChainId = getENSRootChainId(config.namespace);

/**
 * Process-local cache of node migration status.
 *
 * `nodeIsMigrated` is called as a precondition on every ENSv1RegistryOld event handler (NewOwner,
 * Transfer, NewTTL, NewResolver). At scale that is millions of lookups against `migratedNode`.
 *
 * Restart-safe: the Map repopulates via DB reads on cache miss.
 */
const migrationStatus = new Map<Node, boolean>();

/**
 * Returns whether the `node` has migrated to the new Registry contract.
 */
export async function nodeIsMigrated(context: IndexingEngineContext, node: Node) {
  if (context.chain.id !== ensRootChainId) {
    throw new Error(
      `Invariant(nodeIsMigrated): Node migration status is only relevant on the ENS Root Chain, and this function was called in the context of ${context.chain.id}.`,
    );
  }

  // memoize the below operation by `node`
  const cached = migrationStatus.get(node);
  if (cached !== undefined) return cached;

  const record = await context.ensDb.find(ensIndexerSchema.migratedNode, { node });
  const isMigrated = record !== null;
  migrationStatus.set(node, isMigrated);
  return isMigrated;
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

  // memoize the below operation by `node`
  if (migrationStatus.get(node) === true) return;
  migrationStatus.set(node, true);

  await context.ensDb.insert(ensIndexerSchema.migratedNode).values({ node }).onConflictDoNothing();
}
