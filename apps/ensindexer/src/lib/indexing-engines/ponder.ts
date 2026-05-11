/**
 * Ponder Indexing Engine
 *
 * This module provides an abstraction layer over the Ponder Indexing Engine
 * to decouple the core indexing logic of the ENSIndexer from Ponder-specific
 * implementation details. This allows us to build a custom context data model,
 * and implement shared logic before or after event handlers, if needed, without
 * affecting the "hot path" of indexing onchain events.
 *
 * Ponder Indexing Engine runs within an ENSIndexer instance, and is responsible
 * for:
 * - Managing the Ponder Schema and the ENSIndexer Schema in ENSDb instance.
 * - Running HTTP server.
 * - Executing the omnichain indexing strategy for sourcing and handling events.
 *
 * The startup sequence of the Ponder Indexing Engine is as follows:
 * 1. Execute Ponder Config file (apps/ensindexer/ponder/ponder.config.ts),
 *    Ponder Schema file (apps/ensindexer/ponder/ponder.schema.ts),
 *    and all event handler files (as per nested imports in
 *    apps/ensindexer/ponder/src/register-handlers.ts).
 * 2. Connect to the database and initialize required database objects.
 *    a) Execute database migrations for the ENSIndexer Schema in ENSDb.
 *    b) Execute database migrations for the Ponder Schema in ENSDb.
 * 3. Execute Ponder HTTP API file (apps/ensindexer/ponder/src/api/index.ts)
 *    and start the HTTP server.
 * 4. Execute the omnichain indexing strategy
 *    a) Start sourcing onchain events from the configured RPCs for
 *       the indexed contracts.
 *    b) Check if Ponder Checkpoints have been initialized in
 *       the ENSIndexer Schema in ENSDb. If not, execute
 *       the setup event handlers (if any), and initialize
 *       the Ponder Checkpoints in ENSDb.
 *    c) Once the Ponder Checkpoints are initialized, start executing
 *       the onchain event handlers for the sourced onchain events.
 *
 * The ENSIndexer instance has to be able to execute arbitrary logic
 * before any onchain event handlers are executed, for example, to set up
 * necessary state in the ENSNode Schema in ENSDb instance. To achieve this,
 * we define the {@link addOnchainEventListener} function, which is
 * a thin wrapper around {@link ponder.on} that allows us to execute additional
 * logic before the onchain event handlers are executed, while keeping the
 * "hot path" of indexing onchain events as efficient as possible.
 *
 * For more details on Ponder and its concepts, see the Ponder documentation.
 * @see https://ponder.sh/docs/indexing/overview
 */

export * as ensIndexerSchema from "ponder:schema";

import {
  type EventNames,
  type Context as PonderIndexingContext,
  type Event as PonderIndexingEvent,
  ponder,
} from "ponder:registry";

import { logger } from "@/lib/logger";

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

let initIndexingOnchainEventsPromise: Promise<void> | null = null;

// Cumulative events-per-second tracking across the process lifetime. Logged at most
// once per minute. Overhead is one Date.now() and a counter increment per event.
const EPS_LOG_INTERVAL_MS = 60_000;
let epsTotalEvents = 0;
let epsStartTime: number | null = null;
let epsLastLogTime = 0;

function recordEventForEps(): void {
  const now = Date.now();
  if (epsStartTime === null) {
    epsStartTime = now;
    epsLastLogTime = now;
  }
  epsTotalEvents++;
  if (now - epsLastLogTime <= EPS_LOG_INTERVAL_MS) return;
  const durationSec = (now - epsStartTime) / 1000;
  logger.info({
    msg: "Indexing throughput",
    events: epsTotalEvents,
    durationSec: Number(durationSec.toFixed(1)),
    eps: Number((epsTotalEvents / durationSec).toFixed(2)),
  });
  epsLastLogTime = now;
}

/**
 * Execute any necessary preconditions before running an event handler
 * for a given event type.
 *
 * Some event handlers may have preconditions that need to be met before
 * they can run.
 *
 * The Onchain preconditions are memoized and execute their logic only
 * once per process, regardless of how often this function is called — essential
 * because it's invoked for every indexed event. EPS accounting via
 * {@link recordEventForEps} runs on every call, but its hot-path cost is a
 * single Date.now() and a counter increment; structured logging is emitted at
 * most once per {@link EPS_LOG_INTERVAL_MS}.
 */
async function eventHandlerPreconditions(eventType: EventTypeId): Promise<void> {
  recordEventForEps();

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
      if (initIndexingOnchainEventsPromise === null) {
        // We need to work around the Ponder limitation for importing modules,
        // since Ponder would not allow us to use static imports for modules
        // that internally rely on `ponder:api`. Using dynamic imports solves
        // this issue.
        initIndexingOnchainEventsPromise = import("./init-indexing-onchain-events").then(
          ({ initIndexingOnchainEvents }) =>
            // Init the indexing of "onchain" events just once in order to
            // optimize the indexing "hot path", since these events are much
            // more frequent than setup events.
            initIndexingOnchainEvents(),
        );
      }

      return await initIndexingOnchainEventsPromise;
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
