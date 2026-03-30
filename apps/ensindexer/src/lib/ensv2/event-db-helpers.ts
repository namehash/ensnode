import type { Hash } from "viem";

import {
  type AccountId,
  type DomainId,
  makePermissionsId,
  makeResolverId,
} from "@ensnode/ensnode-sdk";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";
import type { LogEventBase } from "@/lib/ponder-helpers";

type Topics = [Hash, ...Hash[]];

/**
 * Constrains the type of topics from [] | [Hash, ...Hash[]] to just [Hash, ...Hash[]]
 */
const hasTopics = (topics: LogEventBase["log"]["topics"]): topics is Topics =>
  topics.length !== 0 && topics[0] !== null;

/**
 * Ensures that an Event entity exists for the given `context` and `event`, returning the Event's
 * unique id.
 *
 * @returns event.id
 */
export async function ensureEvent(context: IndexingEngineContext, event: LogEventBase) {
  // all relevant ENS events obviously have a topic, so we can safely constrain the type of this data
  if (!hasTopics(event.log.topics)) {
    throw new Error(`Invariant: All events indexed via ensureEvent must have at least one topic.`);
  }

  // TODO: ponder provides nulls in the topics array, so we filter them out
  // https://github.com/ponder-sh/ponder/blob/main/packages/core/src/sync-store/encode.ts#L59
  const topics = event.log.topics.filter((topic): topic is Hash => topic !== null) as Topics;

  await context.ensDb
    .insert(ensIndexerSchema.event)
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
      selector: topics[0],
      topics,
      data: event.log.data,
    })
    .onConflictDoNothing();

  return event.id;
}

export async function ensureDomainEvent(
  context: IndexingEngineContext,
  event: LogEventBase,
  domainId: DomainId,
) {
  const eventId = await ensureEvent(context, event);
  await context.ensDb
    .insert(ensIndexerSchema.domainEvent)
    .values({ domainId, eventId })
    .onConflictDoNothing();
}

export async function ensureResolverEvent(
  context: IndexingEngineContext,
  event: LogEventBase,
  resolver: AccountId,
) {
  const eventId = await ensureEvent(context, event);
  await context.ensDb
    .insert(ensIndexerSchema.resolverEvent)
    .values({ resolverId: makeResolverId(resolver), eventId })
    .onConflictDoNothing();
}

export async function ensurePermissionsEvent(
  context: IndexingEngineContext,
  event: LogEventBase,
  contract: AccountId,
) {
  const eventId = await ensureEvent(context, event);
  await context.ensDb
    .insert(ensIndexerSchema.permissionsEvent)
    .values({ permissionsId: makePermissionsId(contract), eventId })
    .onConflictDoNothing();
}
