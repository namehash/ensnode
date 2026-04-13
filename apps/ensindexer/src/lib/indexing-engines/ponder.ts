/**
 * This module is an abstraction layer for the Indexing Engine of ENSIndexer.
 * It decouples core indexing logic from Ponder-specific implementation details.
 * Benefits of this decoupling include:
 * - Building a custom context data model.
 * - Implementing shared logic before or after event handlers, if needed.
 */

export * as ensIndexerSchema from "ponder:schema";

import {
  type EventNames,
  type Context as PonderIndexingContext,
  type Event as PonderIndexingEvent,
  ponder,
} from "ponder:registry";

import { waitForEnsRainbowToBeReady } from "@/lib/ensrainbow/singleton";

/**
 * Context passed to event handlers registered with
 * {@link addOnchainEventListener}.
 */
export interface IndexingEngineContext extends PonderIndexingContext<EventNames> {
  /**
   * Store API for ENSDb.
   *
   * There are two ways to write to the ENSIndexer Schema in ENSDb:
   * 1) Store API — the recommended way, available via `context.ensDb`.
   * 2) Raw SQL API — available via `context.ensDb.sql`. This is
   *    a Drizzle client for the ENSIndexer Schema in ENSDb.
   *    Use only when necessary.
   *
   * The Store API is a SQL-like query builder optimized for common indexing
   * workloads. It's 100-1000x faster than raw SQL. All operations run
   * in-memory and rows are flushed to the database periodically using
   * efficient `COPY` statements.
   *
   * @example Using the Store API:
   * ```ts
   * // Insert a single row
   * await context.ensDb.insert(ensIndexerSchema.account)
   *   .values({ id: interpretedAddress });
   * // Insert multiple rows
   * await context.ensDb.insert(ensIndexerSchema.account)
   *   .values([
   *     { id: interpretedAddress1 },
   *     { id: interpretedAddress2 },
   *   ]);
   * // Find a single row by primary key
   * await context.ensDb.find(ensIndexerSchema.registry, { id: registryId });
   * // Update a row by primary key
   * await context.ensDb.update(ensIndexerSchema.subgraph_domain, { id: node })
   *   .set({ resolverId, resolvedAddressId: resolver.addrId });
   * // Delete a row by primary key
   * await context.ensDb.delete(ensIndexerSchema.resolverAddressRecord, id);
   * ```
   *
   * For more details on the Store API and Raw SQL API, see the Ponder documentation.
   * @see https://ponder.sh/docs/indexing/write#write-to-the-database
   */
  ensDb: PonderIndexingContext<EventNames>["db"];
}

/**
 * Event passed to event handlers registered with
 * {@link addOnchainEventListener}.
 */
export type IndexingEngineEvent<EventName extends EventNames = EventNames> =
  PonderIndexingEvent<EventName>;

/**
 * Args passed to event handlers registered with
 * {@link addOnchainEventListener}.
 */
export interface IndexingEngineEventHandlerArgs<EventName extends EventNames = EventNames> {
  context: IndexingEngineContext;
  event: IndexingEngineEvent<EventName>;
}

/**
 * Build the context for event handlers registered with
 * {@link addOnchainEventListener} from the context provided by
 * Ponder. This is where we can add additional properties or
 * helper functions that should be available in all event handlers.
 */
function buildIndexingEngineContext(
  ponderContext: PonderIndexingContext<EventNames>,
): IndexingEngineContext {
  return {
    ...ponderContext,
    ensDb: ponderContext.db,
  };
}

/**
 * Event type IDs for indexing handlers.
 */
const EventTypeIds = {
  /**
   * Setup event
   *
   * Driven by indexing initialization code, not by indexing an onchain event.
   *
   * Event handlers for the setup events are fully executed before
   * any onchain event handlers are executed, so they can be used to set up
   * necessary state for onchain event handlers.
   */
  Setup: "Setup",

  /**
   * Onchain event
   *
   * Driven by an onchain event emitted by an indexed contract.
   */
  Onchain: "Onchain",
} as const;

/**
 * The derived string union of possible {@link EventTypeIds}.
 */
type EventTypeId = (typeof EventTypeIds)[keyof typeof EventTypeIds];

function buildEventTypeId(eventName: EventNames): EventTypeId {
  if (eventName.endsWith(":setup")) {
    return EventTypeIds.Setup;
  } else {
    return EventTypeIds.Onchain;
  }
}

/**
 * Prepare for executing the "setup" event handlers.
 *
 * During Ponder startup, the "setup" event handlers are executed:
 * - After Ponder completed database migrations for ENSIndexer Schema in ENSDb.
 * - Before Ponder starts processing any onchain events for indexed chains.
 *
 * This function is useful to make sure ENSDb is ready for writes, for example,
 * by ensuring all required Postgres extensions are installed, etc.
 */
async function initializeIndexingSetup(): Promise<void> {
  /**
   * Setup event handlers should not have any *long-running* preconditions. This is because
   * Ponder populates the indexing metrics for all indexed chains only after all setup handlers have run.
   * ENSIndexer relies on these indexing metrics being immediately available on startup to build and
   * store the current Indexing Status in ENSDb.
   */
}

/**
 * Prepare for executing the "onchain" event handlers.
 *
 * During Ponder startup, the "onchain" event handlers are executed
 * after all "setup" event handlers have completed.
 *
 * This function is useful to make sure any long-running preconditions for
 * onchain event handlers are met, for example, waiting for
 * the ENSRainbow instance to be ready before processing any onchain events
 * that require data from ENSRainbow.
 *
 * @example A single blocking precondition
 * ```ts
 * await waitForEnsRainbowToBeReady();
 * ```
 *
 * @example Multiple blocking preconditions
 * ```ts
 * await Promise.all([
 *   waitForEnsRainbowToBeReady(),
 *   waitForAnotherPrecondition(),
 * ]);
 * ```
 */
async function initializeIndexingActivation(): Promise<void> {
  await waitForEnsRainbowToBeReady();
}

let indexingSetupPromise: Promise<void> | null = null;
let indexingActivationPromise: Promise<void> | null = null;

/**
 * Execute any necessary preconditions before running an event handler
 * for a given event type.
 *
 * Some event handlers may have preconditions that need to be met before
 * they can run.
 *
 * This function is idempotent and will only execute its logic once, even if
 * called multiple times. This is to ensure that we affect the "hot path" of
 * indexing as little as possible, since this function is called for every
 * "onchain" event.
 */
async function eventHandlerPreconditions(eventType: EventTypeId): Promise<void> {
  switch (eventType) {
    case EventTypeIds.Setup: {
      if (indexingSetupPromise === null) {
        // Initialize the indexing setup just once.
        indexingSetupPromise = initializeIndexingSetup();
      }

      return await indexingSetupPromise;
    }

    case EventTypeIds.Onchain: {
      if (indexingActivationPromise === null) {
        // Initialize the indexing activation just once in order to
        // optimize the "hot path" of indexing onchain events, since these are
        // much more frequent than setup events.
        indexingActivationPromise = initializeIndexingActivation();
      }

      return await indexingActivationPromise;
    }
  }
}

/**
 * A thin wrapper around `ponder.on` that allows us to:
 * - Provide custom context to event handlers.
 * - Execute additional logic before or after event handlers, if needed.
 *
 * Note that this function is called on every event, so it should be
 * efficient and avoid doing any heavy computations or database queries.
 *
 * For more details on `ponder.on`, see the Ponder indexing guide.
 * @see https://ponder.sh/docs/indexing/overview#register-an-indexing-function
 */
export function addOnchainEventListener<EventName extends EventNames>(
  eventName: EventName,
  eventHandler: (args: IndexingEngineEventHandlerArgs<EventName>) => Promise<void> | void,
) {
  const eventType = buildEventTypeId(eventName);

  return ponder.on(eventName, async ({ context, event }) => {
    await eventHandlerPreconditions(eventType);
    await eventHandler({
      context: buildIndexingEngineContext(context),
      event,
    });
  });
}
