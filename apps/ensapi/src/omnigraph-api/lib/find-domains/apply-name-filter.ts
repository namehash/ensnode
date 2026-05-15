import type { InterpretedName } from "enssdk";

import {
  type BaseDomainSet,
  filterByName,
  filterByNameIn,
} from "@/omnigraph-api/lib/find-domains/layers";
import type { DomainsOrderBy } from "@/omnigraph-api/schema/domain-inputs";

/**
 * Shape of the `DomainsNameFilter` GraphQL input (an `@oneOf` filter over Domain name).
 *
 * Field-level validation (non-empty strings, max-100 names in `in`) is enforced at the GraphQL
 * input layer; this dispatcher trusts its input.
 */
export interface DomainsNameFilterValue {
  starts_with?: string | null;
  eq?: InterpretedName | null;
  in?: InterpretedName[] | null;
}

/**
 * Apply a `DomainsNameFilter` to a base domain set. Dispatches to the appropriate filter layer
 * based on which `@oneOf` field is set. Returns `{ base }` unchanged when `filter` is nullish.
 *
 * - `starts_with` → `filterByName` (typeahead). Surfaces a `defaultOrderBy: "DEPTH"` so resolvers
 *   prefer shorter names when the caller doesn't specify an order.
 * - `eq` → `filterByNameIn([eq])` — sugar for a single-name exact match.
 * - `in` → `filterByNameIn(in)` — exact match against any name in the set.
 */
export function applyDomainsNameFilter(
  base: BaseDomainSet,
  filter: DomainsNameFilterValue | null | undefined,
): { base: BaseDomainSet; defaultOrderBy?: typeof DomainsOrderBy.$inferType } {
  if (!filter) return { base };

  if (filter.starts_with !== undefined && filter.starts_with !== null) {
    return { base: filterByName(base, filter.starts_with), defaultOrderBy: "DEPTH" };
  }

  if (filter.in !== undefined && filter.in !== null) {
    return { base: filterByNameIn(base, filter.in) };
  }

  if (filter.eq !== undefined && filter.eq !== null) {
    return { base: filterByNameIn(base, [filter.eq]) };
  }

  return { base };
}
