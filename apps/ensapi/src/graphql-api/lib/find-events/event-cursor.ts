import type * as schema from "@ensnode/ensnode-schema";

import { cursors } from "@/graphql-api/lib/cursors";

/**
 * Composite Event cursor for keyset pagination.
 * Includes all sort key values to enable proper tuple comparison.
 */
export type EventCursor = Pick<
  typeof schema.event.$inferSelect,
  "timestamp" | "chainId" | "blockNumber" | "transactionIndex" | "logIndex" | "id"
>;

/**
 * Encoding/Decoding helper for Composite EventCursors.
 */
export const EventCursors = {
  encode: (cursor: EventCursor): string => cursors.encode(cursor),
  decode: (cursor: string) => cursors.decode<EventCursor>(cursor),
};
