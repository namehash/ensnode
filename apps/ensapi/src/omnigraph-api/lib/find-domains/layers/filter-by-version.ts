import { eq } from "drizzle-orm";

import { ensDb } from "@/lib/ensdb/singleton";
import type { ENSProtocolVersion } from "@/omnigraph-api/schema/ens-protocol-version";

import { type BaseDomainSet, type DomainType, selectBase } from "./base-domain-set";

const VERSION_TO_DOMAIN_TYPE: Record<typeof ENSProtocolVersion.$inferType, DomainType> = {
  ENSv1: "ENSv1Domain",
  ENSv2: "ENSv2Domain",
};

/**
 * Filter a base domain set by ENS protocol version (ENSv1 or ENSv2).
 */
export function filterByVersion(
  base: BaseDomainSet,
  version: typeof ENSProtocolVersion.$inferType,
) {
  return ensDb
    .select(selectBase(base))
    .from(base)
    .where(eq(base.type, VERSION_TO_DOMAIN_TYPE[version]))
    .as("baseDomains");
}
