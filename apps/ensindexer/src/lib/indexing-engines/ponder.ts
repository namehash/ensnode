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
 * Build the context passed to event handlers registered
 * with {@link addOnchainEventListener} from the context provided by
 * Ponder. This is where we can add any additional properties,
 * or helper functions to the context that we want to be available in
 * all of our event handlers.
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
 * - Execute additional logic before or after the event handler, if needed.
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
