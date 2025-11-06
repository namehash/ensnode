/**
 * This file contains handlers used in event handlers for a subregistry contract.
 */

import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import { type AccountId, type Node, serializeAccountId } from "@ensnode/ensnode-sdk";

/**
 * Upsert Subregistry record
 *
 * If the record already exists, do nothing.
 */
export async function upsertSubregistry(
  context: Context,
  {
    subregistryId,
    node,
  }: {
    subregistryId: AccountId;
    node: Node;
  },
): Promise<void> {
  await context.db
    .insert(schema.subregistries)
    .values({
      subregistryId: serializeAccountId(subregistryId),
      node,
    })
    .onConflictDoNothing();
}

/**
 * Get Subregistry record by AccountId.
 */
export async function getSubregistry(
  context: Context,
  { subregistryId }: { subregistryId: AccountId },
): Promise<typeof schema.subregistries.$inferSelect | null> {
  return context.db.find(schema.subregistries, {
    subregistryId: serializeAccountId(subregistryId),
  });
}
