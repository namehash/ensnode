/**
 * This file contains handlers used in event handlers for a Registrar contract.
 */

import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import { type AccountId, type Node, serializeAccountId } from "@ensnode/ensnode-sdk";

/**
 * Upsert Subregistry record
 *
 * If the record already exists, do noting.
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
) {
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
) {
  return context.db.find(schema.subregistries, {
    subregistryId: serializeAccountId(subregistryId),
  });
}
