import { and, asc, desc, gt, lt } from "drizzle-orm";
import z from "zod/v4";

import { cursors } from "@/omnigraph-api/lib/cursors";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";

type Column = Parameters<typeof lt>[0];

const indexSchema = z.number();
const bigIntSchema = z.coerce.bigint();

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
 * Returns a SQL condition for cursor-based pagination on a `bigint` (Postgres `numeric`) column,
 * such as an EFP `tokenId` — a uint256 that exceeds a JS-safe integer, so the cursor is decoded as
 * a `bigint` (not a `number`) for exact numeric comparison. The decoded value is validated as a
 * `bigint` so a malformed cursor fails cleanly rather than feeding a wrong-typed value into `lt`/`gt`.
 */
export const paginateByBigInt = (
  column: Column,
  before: string | undefined,
  after: string | undefined,
) =>
  and(
    before ? lt(column, bigIntSchema.parse(cursors.decode(before))) : undefined,
    after ? gt(column, bigIntSchema.parse(cursors.decode(after))) : undefined,
  );

/**
 * Returns an order-by clause for cursor-based pagination.
 * Default order is ascending; when `inverted` is true, order is descending.
 */
export const orderPaginationBy = (column: Column, inverted: boolean) =>
  inverted ? desc(column) : asc(column);

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
