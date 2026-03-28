import { type EventNames, type IndexingFunctionArgs, ponder } from "ponder:registry";

/**
 * Adds an event listener for a specific event.
 *
 * This is a thin wrapper around `ponder.on` that allows executing additional logic
 * before or after the event handler if needed.
 *
 * For more details on `ponder.on`, see the Ponder indexing guide.
 * @see https://ponder.sh/docs/indexing/overview#register-an-indexing-function
 */
export function addOnchainEventListener<const EventName extends EventNames>(
  eventName: EventName,
  eventHandler: (args: IndexingFunctionArgs<EventName>) => Promise<void> | void,
) {
  return ponder.on(eventName, eventHandler);
}
