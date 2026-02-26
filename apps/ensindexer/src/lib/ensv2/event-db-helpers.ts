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
    // chain
    chainId: context.chain.id,

    // block
    blockHash: event.block.hash,
    timestamp: event.block.timestamp,

    // transaction
    transactionHash: event.transaction.hash,
    from: event.transaction.from,

    // log
    address: event.log.address,
    logIndex: event.log.logIndex,
  });

  return event.id;
}
