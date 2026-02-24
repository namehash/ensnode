import { eq } from "drizzle-orm";
import type { Address } from "viem";

import {
  type BaseDomainSet,
  selectBase,
} from "@/graphql-api/lib/find-domains/layers/base-domain-set";
import { db } from "@/lib/db";

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
