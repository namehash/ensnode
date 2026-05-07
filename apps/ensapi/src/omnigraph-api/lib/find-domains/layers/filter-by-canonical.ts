import { eq } from "drizzle-orm";

import { ensDb } from "@/lib/ensdb/singleton";

import { getCanonicalRegistriesCTE } from "../canonical-registries-cte";
import { type BaseDomainSet, selectBase } from "./base-domain-set";

/**
 * Filter a base domain set to only include Canonical Domains.
 */
export function filterByCanonical(base: BaseDomainSet) {
  const canonicalRegistries = getCanonicalRegistriesCTE();

  return ensDb
    .select(selectBase(base))
    .from(base)
    .innerJoin(canonicalRegistries, eq(canonicalRegistries.id, base.registryId))
    .as("baseDomains");
}
