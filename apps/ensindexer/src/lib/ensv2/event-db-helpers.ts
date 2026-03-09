import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Hash } from "viem";

import type { LogEvent } from "@/lib/ponder-helpers";

/**
 * Constrains the type of topics from [] | [Hash, ...Hash[]] to just [Hash, ...Hash[]]
 */
const hasTopic0 = (topics: LogEvent["log"]["topics"]): topics is [Hash, ...Hash[]] =>
  topics.length !== 0;

/**
 * Ensures that an Event entity exists for the given `context` and `event`, returning the Event's
 * unique id.
 *
 * @returns event.id
 */
export async function ensureEvent(context: Context, event: LogEvent) {
  if (!hasTopic0(event.log.topics)) {
    throw new Error(`Invariant: All events indexed via ensureEvent must have at least one topic.`);
  }

  await context.db
    .insert(schema.event)
    .values({
      id: event.id,
      // chain
      chainId: context.chain.id,

      // block
      blockNumber: event.block.number,
      blockHash: event.block.hash,
      timestamp: event.block.timestamp,

      // transaction
      transactionHash: event.transaction.hash,
      transactionIndex: event.transaction.transactionIndex,
      from: event.transaction.from,
      to: event.transaction.to,

      // log
      address: event.log.address,
      logIndex: event.log.logIndex,
      topic0: event.log.topics[0],
      topics: event.log.topics,
      data: event.log.data,
    })
    .onConflictDoNothing();

  return event.id;
}
