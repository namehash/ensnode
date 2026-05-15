import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import {
  type AnyColumn,
  and,
  count,
  eq,
  getTableColumns,
  gt,
  gte,
  inArray,
  lt,
  lte,
  type SQL,
  sql,
} from "drizzle-orm";
import type { Address, Hex } from "enssdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { orderPaginationBy, paginateBy } from "@/omnigraph-api/lib/connection-helpers";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { ID_PAGINATED_CONNECTION_ARGS } from "@/omnigraph-api/schema/constants";

/**
 * A join table that relates some entity to events via an `eventId` column.
 */
type EventJoinTable =
  | typeof ensIndexerSchema.domainEvent
  | typeof ensIndexerSchema.resolverEvent
  | typeof ensIndexerSchema.permissionsEvent
  | typeof ensIndexerSchema.permissionsUserEvent;

/**
 * @oneOf set-membership filter shape: exactly one of `eq` or `in` is set.
 */
interface SetFilter<T> {
  eq?: T | null;
  in?: T[] | null;
}

/**
 * Range filter shape: at least one bound is set. `gt`/`gte` are mutually exclusive; `lt`/`lte` are
 * mutually exclusive (enforced by the input type's validators).
 */
interface RangeFilter<T> {
  gt?: T | null;
  gte?: T | null;
  lt?: T | null;
  lte?: T | null;
}

/**
 * Available filter options for find-events queries.
 */
interface EventsWhere {
  selector?: SetFilter<Hex> | null;
  timestamp?: RangeFilter<bigint> | null;
  from?: SetFilter<Address> | null;
  sender?: SetFilter<Address> | null;
}

function setFilterCondition<T>(column: AnyColumn, filter?: SetFilter<T> | null): SQL | undefined {
  if (!filter) return undefined;
  const values = filter.in ?? [filter.eq];
  // NOTE: avoid inArray([]) runtime error by short-circuit to `false`
  if (values.length === 0) return sql`false`;
  return inArray(column, values);
}

function rangeFilterCondition<T>(
  column: AnyColumn,
  filter?: RangeFilter<T> | null,
): SQL | undefined {
  if (!filter) return undefined;
  return and(
    filter.gt != null ? gt(column, filter.gt) : undefined,
    filter.gte != null ? gte(column, filter.gte) : undefined,
    filter.lt != null ? lt(column, filter.lt) : undefined,
    filter.lte != null ? lte(column, filter.lte) : undefined,
  );
}

/**
 * Build SQL conditions from EventsWhere filters.
 */
function eventsWhereConditions(where?: EventsWhere | null): SQL | undefined {
  if (!where) return undefined;

  return and(
    setFilterCondition(ensIndexerSchema.event.selector, where.selector),
    rangeFilterCondition(ensIndexerSchema.event.timestamp, where.timestamp),
    setFilterCondition(ensIndexerSchema.event.from, where.from),
    setFilterCondition(ensIndexerSchema.event.sender, where.sender),
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
      let query = ensDb.select({ count: count() }).from(ensIndexerSchema.event).$dynamic();
      if (through) {
        query = query.innerJoin(
          through.table,
          eq(through.table.eventId, ensIndexerSchema.event.id),
        );
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
          let query = ensDb
            .select(getTableColumns(ensIndexerSchema.event))
            .from(ensIndexerSchema.event)
            .$dynamic();
          if (through) {
            query = query.innerJoin(
              through.table,
              eq(through.table.eventId, ensIndexerSchema.event.id),
            );
          }

          return query
            .where(and(conditions, paginateBy(ensIndexerSchema.event.id, before, after)))
            .orderBy(orderPaginationBy(ensIndexerSchema.event.id, inverted))
            .limit(limit);
        },
      ),
  });
}
