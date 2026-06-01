import { and, asc, desc, gt, lt, sql } from "drizzle-orm";
import z from "zod/v4";

import { cursors } from "@/omnigraph-api/lib/cursors";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";

type Column = Parameters<typeof lt>[0];

const indexSchema = z.number();

/**
 * Returns a SQL condition for cursor-based pagination on a string column.
 */
export const paginateBy = (
  column: Column, //
  before: string | undefined,
  after: string | undefined,
) =>
  and(
    before ? lt(column, cursors.decode(before)) : undefined,
    after ? gt(column, cursors.decode(after)) : undefined,
  );

/**
 * Returns a SQL condition for cursor-based pagination on an integer column.
 * Decodes cursor values as numbers for numeric comparison.
 */
export const paginateByInt = (
  column: Column,
  before: string | undefined,
  after: string | undefined,
) =>
  and(
    before ? lt(column, indexSchema.parse(cursors.decode(before))) : undefined,
    after ? gt(column, indexSchema.parse(cursors.decode(after))) : undefined,
  );

/**
 * Returns an order-by clause for cursor-based pagination.
 * Default order is ascending; when `inverted` is true, order is descending.
 */
export const orderPaginationBy = (column: Column, inverted: boolean) =>
  inverted ? desc(column) : asc(column);

/**
 * Cursor pagination condition for a numeric value stored in a `text` column (e.g. an EFP `tokenId`,
 * a sequential uint256 that does not fit a Postgres integer type). Compares with a `::numeric` cast
 * so ordering is numeric rather than lexicographic (otherwise `"10"` sorts before `"2"`, breaking
 * ordering and the `before`/`after` cursors once there are more than 9 rows).
 */
export const paginateByNumericText = (
  column: Column,
  before: string | undefined,
  after: string | undefined,
) =>
  and(
    before ? sql`${column}::numeric < ${cursors.decode<string>(before)}::numeric` : undefined,
    after ? sql`${column}::numeric > ${cursors.decode<string>(after)}::numeric` : undefined,
  );

/**
 * Order-by clause matching {@link paginateByNumericText}: orders a numeric value held in a `text`
 * column by its numeric value (ascending, or descending when `inverted`).
 */
export const orderByNumericText = (column: Column, inverted: boolean) =>
  inverted ? desc(sql`${column}::numeric`) : asc(sql`${column}::numeric`);

/**
 * An empty Relay Connection, used when short-circuiting connection resolvers.
 */
export const EMPTY_CONNECTION = lazyConnection({
  totalCount: async () => 0,
  connection: async () => ({
    edges: [],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
  }),
});
