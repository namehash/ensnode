import type { InterpretedName } from "enssdk";

import { toJson } from "@ensnode/ensnode-sdk";

import type { DomainsOrderInput } from "@/omnigraph-api/schema/domain-inputs";

import type { BaseDomainSet } from "./base-domain-set";
import { filterByNameIn } from "./filter-by-name-in";
import { filterByNameStartsWith } from "./filter-by-name-starts-with";

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
 * based on which `@oneOf` field is set. Returns `{ named: base }` unchanged when `filter` is
 * nullish.
 *
 * - `starts_with` → `filterByNameStartsWith` (typeahead). Surfaces `defaultOrder: { by: "DEPTH",
 *   dir: "ASC" }` so resolvers prefer shorter names first when the caller doesn't specify an order.
 * - `eq` → `filterByNameIn([eq])` — sugar for a single-name exact match.
 * - `in` → `filterByNameIn(in)` — exact match against any name in the set.
 */
export function filterByName(
  base: BaseDomainSet,
  filter: DomainsNameFilterValue | null,
): { named: BaseDomainSet; defaultOrder?: Partial<typeof DomainsOrderInput.$inferInput> } {
  if (filter === null) return { named: base };

  if (filter.starts_with) {
    return {
      named: filterByNameStartsWith(base, filter.starts_with),
      defaultOrder: { by: "DEPTH", dir: "ASC" },
    };
  }
  if (filter.eq) return { named: filterByNameIn(base, [filter.eq]) };
  if (filter.in) return { named: filterByNameIn(base, filter.in) };

  throw new Error(`Invariant(filterByName): expected 'filter' to not be empty: ${toJson(filter)}`);
}
