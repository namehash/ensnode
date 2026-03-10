import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, asc, desc, eq, getTableColumns, type SQL, sql } from "drizzle-orm";

import * as schema from "@ensnode/ensnode-schema";

import { type EventCursor, EventCursors } from "@/graphql-api/lib/find-events/event-cursor";
import { lazyConnection } from "@/graphql-api/lib/lazy-connection";
import {
  PAGINATION_DEFAULT_MAX_SIZE,
  PAGINATION_DEFAULT_PAGE_SIZE,
} from "@/graphql-api/schema/constants";
import { db } from "@/lib/db";

/**
 * A join table that relates some entity to events via an `eventId` column.
 */
type EventJoinTable =
  | typeof schema.domainEvent
  | typeof schema.resolverEvent
  | typeof schema.permissionsEvents;

/**
 * The columns that define the stable sort order for events, mirroring the composite index on the
 * events table.
 */
const EVENT_SORT_COLUMNS = [
  schema.event.timestamp,
  schema.event.chainId,
  schema.event.blockNumber,
  schema.event.transactionIndex,
  schema.event.logIndex,
  schema.event.id,
] as const;

/**
 * Builds a PostgreSQL row-value comparison for compound cursor pagination.
 * Uses native tuple comparison: (a, b, c) > (x, y, z)
 */
function eventCursorWhere(op: ">" | "<", key: EventCursor): SQL {
  const [tCol, cCol, bCol, txCol, lCol, idCol] = EVENT_SORT_COLUMNS;
  return sql`(${tCol}, ${cCol}, ${bCol}, ${txCol}, ${lCol}, ${idCol}) ${sql.raw(op)} (${key.timestamp}, ${key.chainId}, ${key.blockNumber}, ${key.transactionIndex}, ${key.logIndex}, ${key.id})`;
}

/**
 * Resolves a paginated events connection by joining through a join table to the events table.
 *
 * Reusable for Domain.events, Resolver.events, Permissions.events, etc.
 *
 * @param joinTable - A join table with an `eventId` column (e.g. schema.domainEvent)
 * @param scope - A WHERE condition scoping to the parent entity
 * @param args - Relay connection args (first/last/before/after)
 */
export function resolveFindEvents(
  joinTable: EventJoinTable,
  scope: SQL,
  args: {
    before?: string | null;
    after?: string | null;
    first?: number | null;
    last?: number | null;
  },
) {
  return lazyConnection({
    totalCount: () => db.$count(joinTable, scope),
    connection: () =>
      resolveCursorConnection(
        {
          toCursor: EventCursors.encode,
          defaultSize: PAGINATION_DEFAULT_PAGE_SIZE,
          maxSize: PAGINATION_DEFAULT_MAX_SIZE,
          args,
        },
        ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
          db
            .select(getTableColumns(schema.event))
            .from(joinTable)
            .innerJoin(schema.event, eq(joinTable.eventId, schema.event.id))
            .where(
              and(
                scope,
                after ? eventCursorWhere(">", EventCursors.decode(after)) : undefined,
                before ? eventCursorWhere("<", EventCursors.decode(before)) : undefined,
              ),
            )
            .orderBy(...EVENT_SORT_COLUMNS.map((col) => (inverted ? desc(col) : asc(col))))
            .limit(limit),
      ),
  });
}
