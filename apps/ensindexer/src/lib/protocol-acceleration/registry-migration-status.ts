import config from "@/config";

import { Context } from "ponder:registry";
import schema from "ponder:schema";

import { getENSRootChainId } from "@ensnode/datasources";
import { Node } from "@ensnode/ensnode-sdk";

const ensRootChainId = getENSRootChainId(config.namespace);

/**
 * Returns whether the `node` has migrated to the new Registry contract.
 */
export async function nodeIsMigrated(context: Context, node: Node) {
  if (context.chain.id !== ensRootChainId) {
    throw new Error(
      `Invariant(nodeIsMigrated): Node migration status is only relevant on the ENS Root Chain, and this function was called in the context of ${context.chain.id}.`,
    );
  }

  const record = await context.db.find(schema.ext_migratedNodes, { node });
  return !!record;
}

/**
 * Record that the `node` has migrated to the new Registry contract.
 */
export async function migrateNode(context: Context, node: Node) {
  if (context.chain.id !== ensRootChainId) {
    throw new Error(
      `Invariant(migrateNode): Node migration status is only relevant on the ENS Root Chain, and this function was called in the context of ${context.chain.id}.`,
    );
  }

  await context.db.insert(schema.ext_migratedNodes).values({ node }).onConflictDoNothing();
}
