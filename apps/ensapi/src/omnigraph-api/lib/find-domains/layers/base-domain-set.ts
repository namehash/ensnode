import { and, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
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
 * - parentId is the canonical parent Domain, derived inline by joining to the parent Registry of
 *   this Domain (`registry.id = domain.registryId`) and then to the parent Domain named by
 *   `registry.canonicalDomainId`, requiring that parent Domain's `subregistryId` agree back to
 *   the same Registry. This is the bidirectional canonical-edge agreement, computed on demand
 *   in lieu of a materialized parallel table.
 * - sortableLabel is the Domain's own InterpretedLabel, used for NAME ordering
 * - all other values are directly sourced from Domain
 *
 * All downstream filters (owner, parent, registry, name, canonical) operate on this shape.
 */
export function domainsBase() {
  // alias for parent Registry / parent Domain joins so we can reference them distinctly from
  // the base Domain's own `registryId` column.
  const parentRegistry = alias(ensIndexerSchema.registry, "parentRegistry");
  const parentDomain = alias(ensIndexerSchema.domain, "parentDomain");
  return (
    ensDb
      .select({
        domainId: sql<DomainId>`${ensIndexerSchema.domain.id}`.as("domainId"),
        ownerId: sql<NormalizedAddress | null>`${ensIndexerSchema.domain.ownerId}`.as("ownerId"),
        registryId: sql<RegistryId>`${ensIndexerSchema.domain.registryId}`.as("registryId"),
        parentId: sql<DomainId | null>`${parentDomain.id}`.as("parentId"),
        canonical: sql<boolean>`${ensIndexerSchema.domain.canonical}`.as("canonical"),
        labelHash: sql<string>`${ensIndexerSchema.domain.labelHash}`.as("labelHash"),
        sortableLabel: sql<string | null>`${ensIndexerSchema.label.interpreted}`.as(
          "sortableLabel",
        ),
      })
      .from(ensIndexerSchema.domain)
      // walk up to the parent Registry by this Domain's `registryId`, then to the parent Domain
      // it points at, requiring `parentDomain.subregistryId` to agree back. The two joins +
      // agreement predicate are the bidirectional canonical-edge check.
      .leftJoin(parentRegistry, eq(parentRegistry.id, ensIndexerSchema.domain.registryId))
      .leftJoin(
        parentDomain,
        and(
          eq(parentDomain.id, parentRegistry.canonicalDomainId),
          eq(parentDomain.subregistryId, parentRegistry.id),
        ),
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
