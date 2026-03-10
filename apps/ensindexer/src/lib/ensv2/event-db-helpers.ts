import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Hash } from "viem";

import type { DomainId } from "@ensnode/ensnode-sdk";

import type { LogEvent } from "@/lib/ponder-helpers";

/**
 * Constrains the type of topics from [] | [Hash, ...Hash[]] to just [Hash, ...Hash[]]
 */
const hasTopics = (topics: LogEvent["log"]["topics"]): topics is [Hash, ...Hash[]] =>
  topics.length !== 0;

/**
 * Ensures that an Event entity exists for the given `context` and `event`, returning the Event's
 * unique id.
 *
 * @returns event.id
 */
export async function ensureEvent(context: Context, event: LogEvent) {
  // all relevant ENS events obviously have a topic, so we can safely constrain the type of this data
  if (!hasTopics(event.log.topics)) {
    throw new Error(`Invariant: All events indexed via ensureEvent must have at least one topic.`);
  }

  // TODO: figure out why we're getting null topics in our decoding, which should only happen
  // with an event log / abi mismatch (i.e. the event can be mostly decoded)
  const topics = event.log.topics.filter((topic) => topic !== null) as typeof event.log.topics;

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
      topic0: topics[0],
      topics,
      data: event.log.data,
    })
    .onConflictDoNothing();

  return event.id;
}

export async function ensureDomainEvent(context: Context, event: LogEvent, domainId: DomainId) {
  const eventId = await ensureEvent(context, event);
  await context.db.insert(schema.domainEvent).values({ domainId, eventId });
}
