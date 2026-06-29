import { asc, desc, type SQL, sql } from "drizzle-orm";

import di from "@/di";
import type { DomainCursor } from "@/omnigraph-api/lib/find-domains/domain-cursor";
import type { DomainsOrderBy } from "@/omnigraph-api/schema/domain-inputs";
import type { OrderDirection } from "@/omnigraph-api/schema/order-direction";

/**
 * The order column / expression for each `DomainsOrderBy` value.
 */
function getOrderColumn(orderBy: typeof DomainsOrderBy.$inferType): SQL {
  const { ensIndexerSchema } = di.context;
  switch (orderBy) {
    case "NAME":
      return sql`${ensIndexerSchema.domain.__canonicalNamePrefix}`;
    case "DEPTH":
      return sql`${ensIndexerSchema.domain.canonicalDepth}`;
    case "REGISTRATION_TIMESTAMP":
      return sql`${ensIndexerSchema.domain.__latestRegistrationStart}`;
    case "REGISTRATION_EXPIRY":
      return sql`${ensIndexerSchema.domain.__latestRegistrationExpiry}`;
  }
}

/**
 * Whether the ORDER BY for this column needs an explicit NULLS LAST clause.
 *
 * The registration sort columns (`Domain.__latestRegistration*`) materialize an infinity sentinel
 * (see `REGISTRATION_SORT_SENTINEL`) in place of an absent value, so they're NOT NULL — there are no
 * NULLs to sort last, and a plain `(registry_id, <col>, id)` composite serves both directions.
 * NAME / DEPTH columns are nullable and keep NULLS LAST.
 */
export function shouldUseNullsLast(orderBy: typeof DomainsOrderBy.$inferType): boolean {
  return orderBy === "NAME" || orderBy === "DEPTH";
}

/**
 * Build a cursor filter for keyset pagination on findDomains results.
 *
 * Uses tuple comparison for non-NULL cursor values, and explicit NULL handling
 * for NULL cursor values (since PostgreSQL tuple comparison with NULL yields NULL/unknown).
 *
 * @param cursor - The decoded DomainCursor
 * @param queryOrderBy - The order field for the current query (must match cursor.by)
 * @param queryOrderDir - The order direction for the current query (must match cursor.dir)
 * @param direction - "after" for forward pagination, "before" for backward
 * @throws if cursor.by does not match queryOrderBy
 * @throws if cursor.dir does not match queryOrderDir
 */
export function cursorFilter(
  cursor: DomainCursor,
  queryOrderBy: typeof DomainsOrderBy.$inferType,
  queryOrderDir: typeof OrderDirection.$inferType,
  direction: "after" | "before",
): SQL {
  // Validate cursor was created with the same ordering as the current query
  if (cursor.by !== queryOrderBy) {
    throw new Error(
      `Invalid cursor: cursor was created with orderBy=${cursor.by} but query uses orderBy=${queryOrderBy}`,
    );
  }

  if (cursor.dir !== queryOrderDir) {
    throw new Error(
      `Invalid cursor: cursor was created with orderDir=${cursor.dir} but query uses orderDir=${queryOrderDir}`,
    );
  }

  const orderColumn = getOrderColumn(cursor.by);

  // "after" with ASC and "before" with DESC both step forward in cursor order (greater-than).
  const useGreaterThan = (direction === "after") !== (queryOrderDir === "DESC");
  const op = sql.raw(useGreaterThan ? ">" : "<");
  const { ensIndexerSchema } = di.context;
  const idCmp = sql`${ensIndexerSchema.domain.id} ${op} ${cursor.id}`;

  // NULL cursor values need explicit handling because Postgres tuple comparison with NULL yields
  // NULL/unknown. Reached only for NAME/DEPTH (whose columns are nullable, NULLS LAST); registration
  // sort columns are sentinel-backed NOT NULL, so their cursor value is never null. With NULLS LAST,
  // non-NULL values come before NULL values.
  if (cursor.value === null) {
    return direction === "after"
      ? sql`(${orderColumn} IS NULL AND ${idCmp})`
      : sql`(${orderColumn} IS NOT NULL OR (${orderColumn} IS NULL AND ${idCmp}))`;
  }

  // Drizzle 0.41 doesn't support gt/lt with tuple arrays, so we use raw SQL.
  // Explicit cast required — Postgres can't infer parameter types in tuple comparisons.
  const value = (() => {
    switch (cursor.by) {
      case "NAME":
        return sql`${cursor.value}::text`;
      case "DEPTH":
        return sql`${cursor.value}::int`;
      case "REGISTRATION_TIMESTAMP":
      case "REGISTRATION_EXPIRY":
        // ponder bigints are numeric(78,0)
        return sql`${cursor.value}::numeric(78,0)`;
    }
  })();

  return sql`(${orderColumn}, ${ensIndexerSchema.domain.id}) ${op} (${value}, ${cursor.id})`;
}

/**
 * Compute the effective sort direction, combining user's orderDir with relay's inverted flag.
 * XOR logic: inverted flips the sort for backward pagination.
 */
export function isEffectiveDesc(
  orderDir: typeof OrderDirection.$inferType,
  inverted: boolean,
): boolean {
  return (orderDir === "DESC") !== inverted;
}

export function orderFindDomains(
  orderBy: typeof DomainsOrderBy.$inferType,
  orderDir: typeof OrderDirection.$inferType,
  inverted: boolean,
): SQL[] {
  const effectiveDesc = isEffectiveDesc(orderDir, inverted);
  const orderColumn = getOrderColumn(orderBy);

  const primaryOrder = shouldUseNullsLast(orderBy)
    ? effectiveDesc
      ? sql`${orderColumn} DESC NULLS LAST`
      : sql`${orderColumn} ASC NULLS LAST`
    : effectiveDesc
      ? sql`${orderColumn} DESC`
      : sql`${orderColumn} ASC`;

  const { ensIndexerSchema } = di.context;
  // Always include id as tiebreaker for stable ordering
  const tiebreaker = effectiveDesc
    ? desc(ensIndexerSchema.domain.id)
    : asc(ensIndexerSchema.domain.id);

  return [primaryOrder, tiebreaker];
}
