import { asc, desc, type SQL, sql } from "drizzle-orm";

import type { DomainCursor } from "@/graphql-api/lib/find-domains/domain-cursor";
import type { DomainsWithOrderingMetadata } from "@/graphql-api/lib/find-domains/layers/with-ordering-metadata";
import type { DomainsOrderBy } from "@/graphql-api/schema/domain";
import type { OrderDirection } from "@/graphql-api/schema/order-direction";

/**
 * Get the order column for a given DomainsOrderBy value.
 */
function getOrderColumn(
  domains: DomainsWithOrderingMetadata,
  orderBy: typeof DomainsOrderBy.$inferType,
) {
  return {
    NAME: domains.sortableLabel,
    REGISTRATION_TIMESTAMP: domains.registrationTimestamp,
    REGISTRATION_EXPIRY: domains.registrationExpiry,
  }[orderBy];
}

/**
 * Build a cursor filter for keyset pagination on findDomains results.
 *
 * Uses tuple comparison for non-NULL cursor values, and explicit NULL handling
 * for NULL cursor values (since PostgreSQL tuple comparison with NULL yields NULL/unknown).
 *
 * @param domains - The domains CTE
 * @param cursor - The decoded DomainCursor
 * @param queryOrderBy - The order field for the current query (must match cursor.by)
 * @param queryOrderDir - The order direction for the current query (must match cursor.dir)
 * @param direction - "after" for forward pagination, "before" for backward
 * @param effectiveDesc - Whether the effective sort direction is descending
 * @throws if cursor.by does not match queryOrderBy
 * @throws if cursor.dir does not match queryOrderDir
 * @returns SQL expression for the cursor filter
 */
export function cursorFilter(
  domains: DomainsWithOrderingMetadata,
  cursor: DomainCursor,
  queryOrderBy: typeof DomainsOrderBy.$inferType,
  queryOrderDir: typeof OrderDirection.$inferType,
  direction: "after" | "before",
  effectiveDesc: boolean,
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

  const orderColumn = getOrderColumn(domains, cursor.by);

  // Determine comparison direction:
  // - "after" with ASC = greater than cursor
  // - "after" with DESC = less than cursor
  // - "before" with ASC = less than cursor
  // - "before" with DESC = greater than cursor
  const useGreaterThan = (direction === "after") !== effectiveDesc;

  // Handle NULL cursor values explicitly (PostgreSQL tuple comparison with NULL yields NULL/unknown)
  // With NULLS LAST ordering: non-NULL values come before NULL values
  if (cursor.value === null) {
    if (direction === "after") {
      // "after" a NULL = other NULLs with appropriate id comparison
      return useGreaterThan
        ? sql`(${orderColumn} IS NULL AND ${domains.id} > ${cursor.id})`
        : sql`(${orderColumn} IS NULL AND ${domains.id} < ${cursor.id})`;
    } else {
      // "before" a NULL = all non-NULLs (they come before NULLs) + NULLs with appropriate id
      return useGreaterThan
        ? sql`(${orderColumn} IS NOT NULL OR (${orderColumn} IS NULL AND ${domains.id} > ${cursor.id}))`
        : sql`(${orderColumn} IS NOT NULL OR (${orderColumn} IS NULL AND ${domains.id} < ${cursor.id}))`;
    }
  }

  // Non-null cursor: use tuple comparison
  // NOTE: Drizzle 0.41 doesn't support gt/lt with tuple arrays, so we use raw SQL
  // NOTE: explicit cast required — Postgres can't infer parameter types in tuple comparisons
  const op = useGreaterThan ? ">" : "<";
  const value =
    cursor.by === "NAME" ? sql`${cursor.value}::text` : sql`${cursor.value}::numeric(78,0)`;
  return sql`(${orderColumn}, ${domains.id}) ${sql.raw(op)} (${value}, ${cursor.id})`;
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
  domains: DomainsWithOrderingMetadata,
  orderBy: typeof DomainsOrderBy.$inferType,
  orderDir: typeof OrderDirection.$inferType,
  inverted: boolean,
): SQL[] {
  const effectiveDesc = isEffectiveDesc(orderDir, inverted);
  const orderColumn = getOrderColumn(domains, orderBy);

  // Always use NULLS LAST so unregistered domains (NULL registration fields)
  // appear at the end regardless of sort direction
  const primaryOrder = effectiveDesc
    ? sql`${orderColumn} DESC NULLS LAST`
    : sql`${orderColumn} ASC NULLS LAST`;

  // Always include id as tiebreaker for stable ordering
  const tiebreaker = effectiveDesc ? desc(domains.id) : asc(domains.id);

  return [primaryOrder, tiebreaker];
}
