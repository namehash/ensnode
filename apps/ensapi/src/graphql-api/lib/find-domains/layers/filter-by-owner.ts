import { eq } from "drizzle-orm";
import type { Address } from "viem";

import { db } from "@/lib/db";

import { type BaseDomainSet, selectBase } from "./base-domain-set";

/**
 * Filter a base domain set by owner address.
 */
export function filterByOwner(base: BaseDomainSet, owner: Address) {
  return db //
    .select(selectBase(base))
    .from(base)
    .where(eq(base.ownerId, owner))
    .as("baseDomains");
}
