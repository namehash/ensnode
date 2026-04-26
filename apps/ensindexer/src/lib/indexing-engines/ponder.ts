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
  OnchainEvent: "OnchainEvent",
} as const;

/**
 * The derived string union of possible {@link EventTypeIds}.
 */
type EventTypeId = (typeof EventTypeIds)[keyof typeof EventTypeIds];

function buildEventTypeId(eventName: EventNames): EventTypeId {
  if (eventName.endsWith(":setup")) {
    return EventTypeIds.Setup;
  } else {
    return EventTypeIds.OnchainEvent;
  }
}

let indexingOnchainEventsPromise: Promise<void> | null = null;

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
      // For some ENSIndexer instances, the setup handlers are not defined at all,
      // for example, if the ENSIndexer instance has only the `ensv2` plugin activated.
      // In this case, some important logic, such as running migrations for ENSNode Schema
      // in ENSDb, would not be executed at all, which would cause the ENSIndexer instance
      // to not work properly. Therefore, all logic required to be executed before
      // indexing of onchain events should be executed in initIndexingOnchainEvents function.
      return;
    }

    case EventTypeIds.OnchainEvent: {
      if (indexingOnchainEventsPromise === null) {
        // We need to work around the Ponder limitation for importing modules,
        // since Ponder would not allow us to use static imports for modules
        // that internally rely on `ponder:api`. Using dynamic imports solves
        // this issue.
        indexingOnchainEventsPromise = import("./init-indexing-onchain-events").then(
          ({ initIndexingOnchainEvents }) =>
            // Init the indexing of "onchain" events just once in order to
            // optimize the indexing "hot path", since these events are much
            // more frequent than setup events.
            initIndexingOnchainEvents(),
        );
      }

      return await indexingOnchainEventsPromise;
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
