/**
 * This file contains handlers used in event handlers for a subregistry contract.
 */

import { type AccountId, formatAccountId, type Node } from "@ensnode/ensnode-sdk";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Upsert Subregistry record
 *
 * If the record already exists, do nothing.
 */
export async function upsertSubregistry(
  context: IndexingEngineContext,
  {
    subregistryId,
    node,
  }: {
    subregistryId: AccountId;
    node: Node;
  },
): Promise<void> {
  await context.ensDb
    .insert(ensIndexerSchema.subregistries)
    .values({
      subregistryId: formatAccountId(subregistryId),
      node,
    })
    .onConflictDoNothing();
}

/**
 * Get Subregistry record by AccountId.
 */
export async function getSubregistry(
  context: IndexingEngineContext,
  { subregistryId }: { subregistryId: AccountId },
): Promise<typeof ensIndexerSchema.subregistries.$inferSelect | null> {
  return context.ensDb.find(ensIndexerSchema.subregistries, {
    subregistryId: formatAccountId(subregistryId),
  });
}
