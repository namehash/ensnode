/**
 * This file contains helpers for working with Registrar Event records.
 */
import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import type { RegistrarEventRef } from "@ensnode/ensnode-sdk";

/**
 * Make Registrar Event Ref record in database.
 */
export async function makeRegistrarEventRef(context: Context, event: RegistrarEventRef) {
  const { block, ...remainingEventFields } = event;

  await context.db.insert(schema.registrarEvent).values({
    blockNumber: BigInt(block.number),
    blockTimestamp: BigInt(block.timestamp),
    ...remainingEventFields,
  });
}
