import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, count, eq, getTableColumns, gte, inArray, lte, type SQL, sql } from "drizzle-orm";
import type { Address, Hex } from "viem";

import * as schema from "@ensnode/ensnode-schema";

import { orderPaginationBy, paginateBy } from "@/graphql-api/lib/connection-helpers";
import { lazyConnection } from "@/graphql-api/lib/lazy-connection";
import { ID_PAGINATED_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { db } from "@/lib/db";

/**
 * A join table that relates some entity to events via an `eventId` column.
 */
type EventJoinTable =
  | typeof schema.domainEvent
  | typeof schema.resolverEvent
  | typeof schema.permissionsEvent;

/**
 * Available filter options for find-events queries.
 */
interface EventsWhere {
  /** Filter to events whose first topic matches any of the provided values. */
  topic0_in?: Hex[] | null;
  /** Filter to events at or after this timestamp. */
  timestamp_gte?: bigint | null;
  /** Filter to events at or before this timestamp. */
  timestamp_lte?: bigint | null;
  /** Filter to events sent by this address. */
  from?: Address | null;
}

/**
 * Build SQL conditions from EventsWhere filters.
 */
function eventsWhereConditions(where?: EventsWhere | null): SQL | undefined {
  if (!where) return undefined;

  return and(
    where.topic0_in
      ? where.topic0_in.length
        ? inArray(schema.event.topic0, where.topic0_in)
        : sql`false`
      : undefined,
    typeof where.timestamp_gte === "bigint"
      ? gte(schema.event.timestamp, where.timestamp_gte)
      : undefined,
    typeof where.timestamp_lte === "bigint"
      ? lte(schema.event.timestamp, where.timestamp_lte)
      : undefined,
    where.from ? eq(schema.event.from, where.from) : undefined,
  );
}

/**
 * Resolves a paginated events connection. Always queries the events table directly, with an
 * optional join table to narrow results through a relation (e.g. domainEvent, resolverEvent).
 *
 * @param args - Relay connection args (first/last/before/after)
 * @param options.through - Optional join table with an `eventId` column and scope condition to narrow results through a relation
 * @param options.where - Optional user-facing filters applied to event columns
 */
export function resolveFindEvents(
  {
    where,
    ...args
  }: {
    where?: EventsWhere | null;

    before?: string | null;
    after?: string | null;
    first?: number | null;
    last?: number | null;
  },
  options?: {
    through?: { table: EventJoinTable; scope: SQL };
  },
) {
  const through = options?.through;
  const whereConditions = eventsWhereConditions(where);

  // combine join scope (if specified) + event table conditions
  const conditions = and(through?.scope, whereConditions);

  return lazyConnection({
    totalCount: () => {
      // note: not possible to dynamically change the .select() columns so we make a new query
      let query = db.select({ count: count() }).from(schema.event).$dynamic();
      if (through) {
        query = query.innerJoin(through.table, eq(through.table.eventId, schema.event.id));
      }

      return query.where(conditions).then((rows) => rows[0].count);
    },
    connection: () =>
      resolveCursorConnection(
        {
          ...ID_PAGINATED_CONNECTION_ARGS,
          args,
        },
        ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) => {
          // note: not possible to dynamically change the .select() columns so we make a new query
          let query = db.select(getTableColumns(schema.event)).from(schema.event).$dynamic();
          if (through) {
            query = query.innerJoin(through.table, eq(through.table.eventId, schema.event.id));
          }

          return query
            .where(and(conditions, paginateBy(schema.event.id, before, after)))
            .orderBy(orderPaginationBy(schema.event.id, inverted))
            .limit(limit);
        },
      ),
  });
}
