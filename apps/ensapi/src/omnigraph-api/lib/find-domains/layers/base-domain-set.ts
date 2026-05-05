import { eq, sql } from "drizzle-orm";
import type { DomainId, NormalizedAddress, RegistryId } from "enssdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";

/**
 * The type of the base domain set subquery.
 */
export type BaseDomainSet = ReturnType<typeof domainsBase>;

/**
 * Universal base domain set: all ENSv1 and ENSv2 Domains with consistent metadata.
 *
 * Returns `{ domainId, ownerId, registryId, parentId, canonical, labelHash, sortableLabel }`.
 *
 * All downstream filters (owner, parent, registry, name, canonical) operate on this shape.
 */
export function domainsBase() {
  return (
    ensDb
      .select({
        domainId: sql<DomainId>`${ensIndexerSchema.domain.id}`.as("domainId"),
        ownerId: sql<NormalizedAddress | null>`${ensIndexerSchema.domain.ownerId}`.as("ownerId"),
        registryId: sql<RegistryId>`${ensIndexerSchema.domain.registryId}`.as("registryId"),
        parentId: sql<DomainId | null>`${ensIndexerSchema.registry.canonicalDomainId}`.as(
          "parentId",
        ),
        canonical: sql<boolean>`${ensIndexerSchema.domain.canonical}`.as("canonical"),
        labelHash: sql<string>`${ensIndexerSchema.domain.labelHash}`.as("labelHash"),
        sortableLabel: sql<string | null>`${ensIndexerSchema.label.interpreted}`.as(
          "sortableLabel",
        ),
      })
      .from(ensIndexerSchema.domain)
      // parent: materialized via `registry.canonicalDomainId`. The bidirectional invariant
      // (`Domain.canonicalSubregistryId` ↔ `Registry.canonicalDomainId`) guarantees consistency,
      // so no edge-auth join is required.
      .leftJoin(
        ensIndexerSchema.registry,
        eq(ensIndexerSchema.registry.id, ensIndexerSchema.domain.registryId),
      )
      // join label for labelHash/sortableLabel
      .leftJoin(
        ensIndexerSchema.label,
        eq(ensIndexerSchema.label.labelHash, ensIndexerSchema.domain.labelHash),
      )
      .as("baseDomains")
  );
}

/**
 * Select all columns from a base domain set subquery. Use this in filter layers
 * to produce a select with the same shape as the base.
 */
export function selectBase(base: BaseDomainSet) {
  return {
    domainId: base.domainId,
    ownerId: base.ownerId,
    registryId: base.registryId,
    parentId: base.parentId,
    canonical: base.canonical,
    labelHash: base.labelHash,
    sortableLabel: base.sortableLabel,
  };
}
