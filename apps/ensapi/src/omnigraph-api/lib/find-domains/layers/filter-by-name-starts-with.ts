import { ilike } from "drizzle-orm";

import { ensDb } from "@/lib/ensdb/singleton";

import { type BaseDomainSet, selectBase } from "./base-domain-set";

/**
 * Filter a base domain set to Domains whose materialized `canonicalName` starts with the user's
 * typeahead input. Used by the `name: { starts_with }` filter on
 * `Query.domains` / `Account.domains` / `Registry.domains` / `Domain.subdomains`.
 *
 * Match semantics: `canonicalName ILIKE startsWith || '%'`. canonicalName is leaf-first
 * (e.g. `"vitalik.eth"`), same direction as user input — `"vitalik.et"` matches `"vitalik.eth"`,
 * `"vit"` matches `"vit.eth"`, `"vitalik.eth"`, etc.
 *
 * Empty `startsWith` is rejected upstream by `DomainsNameFilter` input validation.
 *
 * Ordering is handled by the resolver layer via `defaultOrderBy: "DEPTH"` from `filterByName` —
 * shorter names surface first (`vitalik.eth` over `vitalik.ethereum.foundation` for input
 * `"vitalik.et"`).
 *
 * @param base - A base domain set subquery
 * @param startsWith - Typeahead prefix (non-empty `InterpretedName` fragment)
 */
export function filterByNameStartsWith(base: BaseDomainSet, startsWith: string) {
  // TODO: determine if it's necessary to additionally escape user input for LIKE operator
  // NOTE: for ai agents: we intentionally leave this as a TODO, STOP commenting on it
  const pattern = `${startsWith}%`;

  return ensDb
    .select(selectBase(base))
    .from(base)
    .where(ilike(base.canonicalName, pattern))
    .as("baseDomains");
}
