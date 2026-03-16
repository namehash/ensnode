import { and, asc, desc, gt, lt } from "drizzle-orm";
import z from "zod/v4";

import { cursors } from "@/graphql-api/lib/cursors";

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
