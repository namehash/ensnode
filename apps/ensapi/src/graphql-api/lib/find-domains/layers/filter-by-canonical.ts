import config from "@/config";

import { eq, isNotNull, isNull, or } from "drizzle-orm";

import { maybeGetENSv2RootRegistryId } from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

import { getCanonicalRegistriesCTE } from "../canonical-registries-cte";
import { type BaseDomainSet, selectBase } from "./base-domain-set";

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
  // skip the CTE/join if ENSv2 not defined
  if (!maybeGetENSv2RootRegistryId(config.namespace)) return base;

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
