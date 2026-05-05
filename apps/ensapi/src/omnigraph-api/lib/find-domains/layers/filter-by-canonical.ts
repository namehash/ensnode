import { eq } from "drizzle-orm";

import { ensDb } from "@/lib/ensdb/singleton";

import { type BaseDomainSet, selectBase } from "./base-domain-set";

/**
 * Filter a base domain set to only include Canonical Domains.
 *
 * Reads the materialized `domain.canonical` flag, which is maintained at index time by the
 * canonicality db helpers (Registry/Domain bidirectional pointers + cascading flips).
 */
export function filterByCanonical(base: BaseDomainSet) {
  return ensDb
    .select(selectBase(base))
    .from(base)
    .where(eq(base.canonical, true))
    .as("baseDomains");
}
