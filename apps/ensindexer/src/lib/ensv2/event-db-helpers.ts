import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Hash } from "viem";

import type { DomainId } from "@ensnode/ensnode-sdk";

import { toJson } from "@/lib/json-stringify-with-bigints";
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

  // NOTE: if the ABIs used to decode the event don't match perfectly, we get garbage `null`s in the
  // topics array, so we use that as a canary to remind the ENSNode developer to update their ABIs
  if (event.log.topics.some((topic) => topic === null)) {
    throw new Error(
      `Invariant: The decoded topics includes malformed topics. This implies that the ABI used for decoding does not exactly match the ABI used to emit this log on-chain. This probably only occurs when running against the ens-test-env during active development. \nTopics: ${toJson(event.log.topics)}`,
    );
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

export async function ensureDomainEvent(context: Context, event: LogEvent, domainId: DomainId) {
  const eventId = await ensureEvent(context, event);
  await context.db.insert(schema.domainEvent).values({ domainId, eventId });
}
