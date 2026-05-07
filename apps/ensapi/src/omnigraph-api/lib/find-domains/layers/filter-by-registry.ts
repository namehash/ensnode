import { eq } from "drizzle-orm";
import type { RegistryId } from "enssdk";

import { ensDb } from "@/lib/ensdb/singleton";

import { type BaseDomainSet, selectBase } from "./base-domain-set";

/**
 * Filter a base domain set to domains belonging to a specific Registry.
 */
export function filterByRegistry(base: BaseDomainSet, registryId: RegistryId) {
  return ensDb
    .select(selectBase(base))
    .from(base)
    .where(eq(base.registryId, registryId))
    .as("baseDomains");
}
