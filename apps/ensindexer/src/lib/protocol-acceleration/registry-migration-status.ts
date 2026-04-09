import config from "@/config";

import type { Node } from "enssdk";

import { getENSRootChainId } from "@ensnode/datasources";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

const ensRootChainId = getENSRootChainId(config.namespace);

/**
 * Returns whether the `node` has migrated to the new Registry contract.
 */
export async function nodeIsMigrated(context: IndexingEngineContext, node: Node) {
  if (context.chain.id !== ensRootChainId) {
    throw new Error(
      `Invariant(nodeIsMigrated): Node migration status is only relevant on the ENS Root Chain, and this function was called in the context of ${context.chain.id}.`,
    );
  }

  const record = await context.ensDb.find(ensIndexerSchema.migratedNode, { node });
  return !!record;
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
}
