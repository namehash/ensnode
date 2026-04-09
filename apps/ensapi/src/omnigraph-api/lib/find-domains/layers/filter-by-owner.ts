import { eq } from "drizzle-orm";
import type { Address } from "enssdk";

import { ensDb } from "@/lib/ensdb/singleton";

import { type BaseDomainSet, selectBase } from "./base-domain-set";

/**
 * Filter a base domain set by owner address.
 */
export function filterByOwner(base: BaseDomainSet, owner: Address) {
  return ensDb //
    .select(selectBase(base))
    .from(base)
    .where(eq(base.ownerId, owner))
    .as("baseDomains");
}
