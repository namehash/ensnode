/**
 * This file contains handlers used in event handlers for a Registrar contract.
 */

import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import { type AccountId, type Node, serializeAccountId } from "@ensnode/ensnode-sdk";

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
    .insert(schema.subregistry)
    .values({
      subregistryId: serializeAccountId(subregistryId),
      node,
    })
    .onConflictDoNothing();
}
