import { and, asc, desc, gt, lt } from "drizzle-orm";

import { cursors } from "@/graphql-api/schema/cursors";

type Column = Parameters<typeof lt>[0];

/**
 * Returns a SQL condition for cursor-based pagination.
 * Suitable for use directly in `.where()` or composed with `and(scope, paginateBy(...))`.
 */
export const paginateBy = (column: Column, before: string | undefined, after: string | undefined) =>
  and(
    before ? lt(column, cursors.decode(before)) : undefined,
    after ? gt(column, cursors.decode(after)) : undefined,
  );

/**
 * Returns an order-by clause for cursor-based pagination.
 * Default order is ascending; when `inverted` is true, order is descending.
 */
export const orderPaginationBy = (column: Column, inverted: boolean) =>
  inverted ? desc(column) : asc(column);
