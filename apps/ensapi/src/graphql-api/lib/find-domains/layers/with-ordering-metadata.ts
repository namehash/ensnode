import { and, eq, sql } from "drizzle-orm";

import * as schema from "@ensnode/ensnode-schema";
import type { DomainId } from "@ensnode/ensnode-sdk";

import type { BaseDomainSet } from "@/graphql-api/lib/find-domains/layers/base-domain-set";
import { db } from "@/lib/db";

/**
 * Enrich a base domain set with ordering metadata.
 *
 * Joins latestRegistrationIndex → registration → event for registration-based ordering.
 * Uses sortableLabel from the base set for NAME ordering.
 *
 * Returns a CTE with columns: {id, headLabel, registrationTimestamp, registrationExpiry}
 * suitable for cursor-based pagination.
 *
 * @param base - A base domain set (output of any filter layer)
 */
export function withOrderingMetadata(base: BaseDomainSet) {
  const domains = db
    .select({
      id: sql<DomainId>`${base.domainId}`.as("id"),

      // for NAME ordering (from base's sortableLabel, possibly overridden by filterByName)
      headLabel: base.sortableLabel,

      // for REGISTRATION_TIMESTAMP ordering
      registrationTimestamp: schema.event.timestamp,

      // for REGISTRATION_EXPIRY ordering
      registrationExpiry: schema.registration.expiry,
    })
    .from(base)
    // join latestRegistrationIndex
    .leftJoin(
      schema.latestRegistrationIndex,
      eq(schema.latestRegistrationIndex.domainId, base.domainId),
    )
    // join (latest) Registration
    .leftJoin(
      schema.registration,
      and(
        eq(schema.registration.domainId, base.domainId),
        eq(schema.registration.index, schema.latestRegistrationIndex.index),
      ),
    )
    // join (latest) Registration's Event
    .leftJoin(schema.event, eq(schema.event.id, schema.registration.eventId));

  return db.$with("domains").as(domains);
}
