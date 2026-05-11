import type { InterpretedName } from "enssdk";

import {
  type BaseDomainSet,
  FILTER_BY_NAME_IN_MAX_NAMES,
  filterByName,
  filterByNameIn,
} from "@/omnigraph-api/lib/find-domains/layers";

/**
 * Shape of the `DomainsNameFilter` GraphQL input (an `@oneOf` filter over Domain name).
 */
export interface DomainsNameFilterValue {
  starts_with?: string | null;
  eq?: InterpretedName | null;
  in?: InterpretedName[] | null;
}

/**
 * Apply a `DomainsNameFilter` to a base domain set. Dispatches to the appropriate filter layer
 * based on which `@oneOf` field is set. Returns `base` unchanged when `filter` is nullish.
 *
 * - `starts_with` → `filterByName` (prefix match on last label, exact on ancestors).
 * - `eq` → `filterByNameIn([eq])` — sugar for a single-name exact match.
 * - `in` → `filterByNameIn(in)` — exact match against any name in the set.
 *
 * Enforces a maximum of {@link FILTER_BY_NAME_IN_MAX_NAMES} entries in the `in` filter.
 */
export function applyDomainsNameFilter(
  base: BaseDomainSet,
  filter: DomainsNameFilterValue | null | undefined,
): BaseDomainSet {
  if (!filter) return base;

  if (filter.starts_with !== undefined && filter.starts_with !== null) {
    return filterByName(base, filter.starts_with);
  }

  if (filter.in !== undefined && filter.in !== null) {
    if (filter.in.length > FILTER_BY_NAME_IN_MAX_NAMES) {
      throw new Error(
        `'name.in' accepts at most ${FILTER_BY_NAME_IN_MAX_NAMES} names; received ${filter.in.length}.`,
      );
    }
    return filterByNameIn(base, filter.in);
  }

  if (filter.eq !== undefined && filter.eq !== null) {
    return filterByNameIn(base, [filter.eq]);
  }

  return base;
}
