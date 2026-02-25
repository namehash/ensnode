import { eq, isNotNull, isNull, or } from "drizzle-orm";

import { getCanonicalRegistriesCTE } from "@/graphql-api/lib/find-domains/canonical-registries-cte";
import {
  type BaseDomainSet,
  selectBase,
} from "@/graphql-api/lib/find-domains/layers/base-domain-set";
import { db } from "@/lib/db";

/**
 * Filter a base domain set to only include Canonical Domains.
 *
 * All v1Domains are Canonical (registryId IS NULL).
 * v2Domains are Canonical iff their registryId is reachable from the ENSv2 Root Registry.
 *
 * Uses LEFT JOIN with canonical registries CTE: v1 domains pass through (registryId IS NULL),
 * v2 domains must match a canonical registry.
 */
export function filterByCanonical(base: BaseDomainSet) {
  const canonicalRegistries = getCanonicalRegistriesCTE();

  return db
    .select(selectBase(base))
    .from(base)
    .leftJoin(canonicalRegistries, eq(canonicalRegistries.id, base.registryId))
    .where(
      or(
        isNull(base.registryId), // v1 domains are always canonical
        isNotNull(canonicalRegistries.id), // v2 domains must be in a canonical registry
      ),
    )
    .as("baseDomains");
}
