import { and, eq, sql } from "drizzle-orm";
import type { DomainId, InterpretedName } from "enssdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";

import type { BaseDomainSet } from "./base-domain-set";

export type DomainsWithOrderingMetadata = ReturnType<typeof withOrderingMetadata>;

/**
 * Type of row from `withOrderingMetadata`
 *
 * @dev should be able to derive this from drizzle, right??
 */
export type DomainsWithOrderingMetadataResult = {
  id: DomainId;
  canonicalName: InterpretedName | null;
  canonicalDepth: number | null;
  registrationTimestamp: bigint | null;
  registrationExpiry: bigint | null;
};

/**
 * Enrich a base domain set with ordering metadata.
 *
 * Joins latestRegistrationIndex → registration for registration-based ordering. canonicalName /
 * canonicalDepth pass through from the base set for NAME / DEPTH ordering.
 *
 * Returns a CTE suitable for cursor-based pagination.
 *
 * @param base - A base domain set (output of any filter layer)
 */
export function withOrderingMetadata(base: BaseDomainSet) {
  const domains = ensDb
    .select({
      id: sql<DomainId>`${base.domainId}`.as("id"),

      // for NAME / DEPTH ordering
      canonicalName: base.canonicalName,
      canonicalDepth: base.canonicalDepth,

      // for REGISTRATION_TIMESTAMP ordering (materialized on registration)
      registrationTimestamp: ensIndexerSchema.registration.start,

      // for REGISTRATION_EXPIRY ordering
      registrationExpiry: ensIndexerSchema.registration.expiry,
    })
    .from(base)
    // join latestRegistrationIndex
    .leftJoin(
      ensIndexerSchema.latestRegistrationIndex,
      eq(ensIndexerSchema.latestRegistrationIndex.domainId, base.domainId),
    )
    // join (latest) Registration
    .leftJoin(
      ensIndexerSchema.registration,
      and(
        eq(ensIndexerSchema.registration.domainId, base.domainId),
        eq(
          ensIndexerSchema.registration.registrationIndex,
          ensIndexerSchema.latestRegistrationIndex.registrationIndex,
        ),
      ),
    );

  return ensDb.$with("domains").as(domains);
}
