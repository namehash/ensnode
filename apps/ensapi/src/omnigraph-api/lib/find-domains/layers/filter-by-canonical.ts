import { eq } from "drizzle-orm";

import { ensDb } from "@/lib/ensdb/singleton";

import { type BaseDomainSet, selectBase } from "./base-domain-set";

/**
 * Filter a base domain set to only include Canonical Domains.
 */
export function filterByCanonical(base: BaseDomainSet) {
  return ensDb
    .select(selectBase(base))
    .from(base)
    .where(eq(base.canonical, true))
    .as("baseDomains");
}
