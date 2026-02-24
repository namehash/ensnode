import { eq } from "drizzle-orm";

import type { DomainId } from "@ensnode/ensnode-sdk";

import {
  type BaseDomainSet,
  selectBase,
} from "@/graphql-api/lib/find-domains/layers/base-domain-set";
import { db } from "@/lib/db";

/**
 * Filter a base domain set to children of a specific parent domain.
 *
 * Works uniformly for v1 and v2 domains because the base domain set derives
 * parentId for both: v1 from the parentId column, v2 via canonical registry traversal.
 */
export function filterByParent(base: BaseDomainSet, parentId: DomainId) {
  return db
    .select(selectBase(base))
    .from(base)
    .where(eq(base.parentId, parentId))
    .as("baseDomains");
}
