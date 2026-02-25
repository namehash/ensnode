import { eq } from "drizzle-orm";

import type { RegistryId } from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

import { type BaseDomainSet, selectBase } from "./base-domain-set";

/**
 * Filter a base domain set to domains belonging to a specific registry.
 *
 * Only v2 domains have a non-NULL registryId, so this effectively filters to v2 domains
 * in the given registry.
 */
export function filterByRegistry(base: BaseDomainSet, registryId: RegistryId) {
  return db
    .select(selectBase(base))
    .from(base)
    .where(eq(base.registryId, registryId))
    .as("baseDomains");
}
