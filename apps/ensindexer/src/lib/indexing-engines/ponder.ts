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
  return ponder.on(eventName, ({ context, event }) =>
    eventHandler({
      context: buildIndexingEngineContext(context),
      event,
    }),
  );
}
