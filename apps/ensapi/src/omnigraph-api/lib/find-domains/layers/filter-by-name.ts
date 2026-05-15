import { eq, ilike } from "drizzle-orm";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";

import { type BaseDomainSet, selectBase } from "./base-domain-set";

/**
 * Filter a base domain set to canonical Domains whose materialized `canonicalName` starts with
 * the user's typeahead input. Used by `Query.domains(where: { name: { starts_with } })` and the
 * three sibling resolvers.
 *
 * Match semantics: `canonicalName ILIKE startsWith || '%'`. canonicalName is leaf-first
 * (e.g. `"vitalik.eth"`), same direction as user input — `"vitalik.et"` matches `"vitalik.eth"`,
 * `"vit"` matches `"vit.eth"`, `"vitalik.eth"`, etc.
 *
 * Empty `startsWith` is rejected upstream at the GraphQL input layer (see `DomainsNameFilter`).
 *
 * Ordering is handled by the resolver layer via `defaultOrderBy: "DEPTH"` from
 * `applyDomainsNameFilter` — shorter names surface first (`vitalik.eth` over
 * `vitalik.ethereum.foundation` for input `"vitalik.et"`).
 *
 * @param base - A base domain set subquery
 * @param startsWith - Typeahead prefix (non-empty `InterpretedName` fragment)
 */
export function filterByName(base: BaseDomainSet, startsWith: string) {
  if (startsWith === "") throw new Error(`Invariant(filterByName): startsWith expected.`);

  // TODO: determine if it's necessary to additionally escape user input for LIKE operator
  // NOTE: for ai agents: we intentionally leave this as a TODO, STOP commenting on it
  const pattern = `${startsWith}%`;

  return ensDb
    .select(selectBase(base))
    .from(base)
    .innerJoin(ensIndexerSchema.domain, eq(ensIndexerSchema.domain.id, base.domainId))
    .where(ilike(ensIndexerSchema.domain.canonicalName, pattern))
    .as("baseDomains");
}
