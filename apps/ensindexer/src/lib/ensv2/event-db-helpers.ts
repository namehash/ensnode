import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import type { LogEvent } from "@/lib/ponder-helpers";

/**
 * Ensures that an Event entity exists for the given `context` and `event`, returning the Event's
 * unique id.
 *
 * @returns event.id
 */
export async function ensureEvent(context: Context, event: LogEvent) {
  await context.db.insert(schema.event).values({
    id: event.id,
    chainId: context.chain.id,
    address: event.log.address,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    logIndex: event.log.logIndex,
  });
  return event.id;
}
