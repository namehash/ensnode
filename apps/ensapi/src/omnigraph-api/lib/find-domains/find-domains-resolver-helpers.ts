import { asc, desc, type SQL, sql } from "drizzle-orm";

import { truncateCanonicalNamePrefix } from "@ensnode/ensdb-sdk/ensindexer-abstract";

import di from "@/di";
import type { DomainCursor } from "@/omnigraph-api/lib/find-domains/domain-cursor";
import type { DomainsOrderBy } from "@/omnigraph-api/schema/domain-inputs";
import type { OrderDirection } from "@/omnigraph-api/schema/order-direction";

/**
 * Truncate a `canonicalName` to the materialized `__canonical_name_prefix` length when writing the
 * `DomainCursor.value` of NAME orderings. Pre-truncating once at encode time keeps the encoded
 * cursor small (long names hit thousands of characters) and lets `cursorFilter` compare directly
 * against the `__canonical_name_prefix` column with no per-row `left(...)`.
 *
 * Delegates to {@link truncateCanonicalNamePrefix} so the cursor prefix is byte-identical to the
 * column the NAME index sorts on.
 */
export function truncateNameForCursor(name: string | null): string | null {
  return truncateCanonicalNamePrefix(name);
}

/**
 * The order column / expression for each `DomainsOrderBy` value.
 *
 * Computed lazily using sql template so importing this module doesn't access the lazyProxy-backed
 * `ensIndexerSchema` at module load time (test harnesses import it without env-driven DB
 * config wired up).
 */
function getOrderColumn(orderBy: typeof DomainsOrderBy.$inferType): SQL {
  const { ensIndexerSchema } = di.context;
  switch (orderBy) {
    case "NAME":
      return sql`${ensIndexerSchema.domain.__canonicalNamePrefix}`;
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

  // "after" with ASC and "before" with DESC both step forward in cursor order (greater-than).
  const useGreaterThan = (direction === "after") !== (queryOrderDir === "DESC");
  const op = sql.raw(useGreaterThan ? ">" : "<");
  const { ensIndexerSchema } = di.context;
  const idCmp = sql`${ensIndexerSchema.domain.id} ${op} ${cursor.id}`;

  // NULL cursor values need explicit handling because Postgres tuple comparison with NULL yields
  // NULL/unknown. With NULLS LAST ordering, non-NULL values come before NULL values.
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
        // Already pre-truncated at encode time (see `truncateNameForCursor`), so this matches the
        // `__canonical_name_prefix` column the NAME order sorts on directly.
        return sql`${cursor.value}::text`;
      case "DEPTH":
        return sql`${cursor.value}::int`;
      case "REGISTRATION_TIMESTAMP":
      case "REGISTRATION_EXPIRY":
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

  // Always use NULLS LAST so unregistered domains (NULL registration fields)
  // appear at the end regardless of sort direction
  const primaryOrder = effectiveDesc
    ? sql`${orderColumn} DESC NULLS LAST`
    : sql`${orderColumn} ASC NULLS LAST`;

  const { ensIndexerSchema } = di.context;
  // Always include id as tiebreaker for stable ordering
  const tiebreaker = effectiveDesc
    ? desc(ensIndexerSchema.domain.id)
    : asc(ensIndexerSchema.domain.id);

  return [primaryOrder, tiebreaker];
}
