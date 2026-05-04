import { eq } from "drizzle-orm";
import type { DomainId } from "enssdk";

import { ensDb } from "@/lib/ensdb/singleton";

import { type BaseDomainSet, selectBase } from "./base-domain-set";

/**
 * Filter a base domain set to children of a specific parent domain.
 */
export function filterByParent(base: BaseDomainSet, parentId: DomainId) {
  return ensDb
    .select(selectBase(base))
    .from(base)
    .where(eq(base.parentId, parentId))
    .as("baseDomains");
}
