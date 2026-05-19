import { asc, desc, type SQL, sql } from "drizzle-orm";

import { ensIndexerSchema } from "@/lib/ensdb/singleton";
import type { DomainCursor } from "@/omnigraph-api/lib/find-domains/domain-cursor";
import type { DomainsOrderBy } from "@/omnigraph-api/schema/domain-inputs";
import type { OrderDirection } from "@/omnigraph-api/schema/order-direction";

/**
 * Length cap (in characters) of the `canonical_name` prefix used by:
 *   1. the `(registry_id, left(canonical_name, N), id)` composite btree on `domains`, and
 *   2. all NAME-ordered queries' ORDER BY and cursor-comparison expressions.
 *
 * The btree per-tuple max is ~2712 bytes; with `registry_id` and `id` consuming ~240 bytes of
 * that, ~2400 bytes remain for the prefix expression. 256 chars × max 4-byte UTF-8 codepoint =
 * 1024 bytes, well under the limit and within the realm of reasonable name lengths (mainnet avg
 * is ~126). Queries MUST sort by this same expression for the planner to use the index for
 * ordered scan; raw `canonical_name` ORDER BY falls back to a full scan + sort.
 */
export const CANONICAL_NAME_SORT_PREFIX = 256;

/**
 * The order column / expression for each `DomainsOrderBy` value.
 *
 * Computed lazily on call so importing this module doesn't access the lazyProxy-backed
 * `ensIndexerSchema` at module load time (test harnesses import it without env-driven DB
 * config wired up).
 */
function getOrderColumn(orderBy: typeof DomainsOrderBy.$inferType): SQL {
  switch (orderBy) {
    case "NAME":
      return sql`left(${ensIndexerSchema.domain.canonicalName}, ${sql.raw(String(CANONICAL_NAME_SORT_PREFIX))})`;
    case "DEPTH":
      return sql`${ensIndexerSchema.domain.canonicalDepth}`;
    case "REGISTRATION_TIMESTAMP":
      return sql`${ensIndexerSchema.registration.start}`;
    case "REGISTRATION_EXPIRY":
      return sql`${ensIndexerSchema.registration.expiry}`;
  }
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

  // Determine comparison direction:
  // - "after" with ASC = greater than cursor
  // - "after" with DESC = less than cursor
  // - "before" with ASC = less than cursor
  // - "before" with DESC = greater than cursor
  const useGreaterThan = (direction === "after") !== (queryOrderDir === "DESC");

  // Handle NULL cursor values explicitly (PostgreSQL tuple comparison with NULL yields NULL/unknown)
  // With NULLS LAST ordering: non-NULL values come before NULL values
  if (cursor.value === null) {
    if (direction === "after") {
      // "after" a NULL = other NULLs with appropriate id comparison
      return useGreaterThan
        ? sql`(${orderColumn} IS NULL AND ${ensIndexerSchema.domain.id} > ${cursor.id})`
        : sql`(${orderColumn} IS NULL AND ${ensIndexerSchema.domain.id} < ${cursor.id})`;
    } else {
      // "before" a NULL = all non-NULLs (they come before NULLs) + NULLs with appropriate id
      return useGreaterThan
        ? sql`(${orderColumn} IS NOT NULL OR (${orderColumn} IS NULL AND ${ensIndexerSchema.domain.id} > ${cursor.id}))`
        : sql`(${orderColumn} IS NOT NULL OR (${orderColumn} IS NULL AND ${ensIndexerSchema.domain.id} < ${cursor.id}))`;
    }
  }

  // Non-null cursor: use tuple comparison
  // NOTE: Drizzle 0.41 doesn't support gt/lt with tuple arrays, so we use raw SQL
  // NOTE: explicit cast required — Postgres can't infer parameter types in tuple comparisons
  const op = useGreaterThan ? ">" : "<";
  const value = (() => {
    switch (cursor.by) {
      case "NAME":
        // Truncate the cursor's stored name to match the index expression, so the comparison
        // operates on the same prefix that the index is keyed on.
        return sql`left(${cursor.value}::text, ${sql.raw(String(CANONICAL_NAME_SORT_PREFIX))})`;
      case "DEPTH":
        return sql`${cursor.value}::int`;
      case "REGISTRATION_TIMESTAMP":
      case "REGISTRATION_EXPIRY":
        return sql`${cursor.value}::numeric(78,0)`;
    }
  })();
  return sql`(${orderColumn}, ${ensIndexerSchema.domain.id}) ${sql.raw(op)} (${value}, ${cursor.id})`;
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

  // Always use NULLS LAST so unregistered domains (NULL registration fields)
  // appear at the end regardless of sort direction
  const primaryOrder = effectiveDesc
    ? sql`${orderColumn} DESC NULLS LAST`
    : sql`${orderColumn} ASC NULLS LAST`;

  // Always include id as tiebreaker for stable ordering
  const tiebreaker = effectiveDesc
    ? desc(ensIndexerSchema.domain.id)
    : asc(ensIndexerSchema.domain.id);

  return [primaryOrder, tiebreaker];
}
