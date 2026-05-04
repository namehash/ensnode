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
 * Returns `{ domainId, ownerId, registryId, parentId, labelHash, sortableLabel }` where `parentId`
 * is derived via the domain's registry → canonical domain link (`registryCanonicalDomain`)
 * and `sortableLabel` is the domain's own interpreted label, used for NAME ordering, and can be
 * overridden by later layers.
 *
 * All downstream filters (owner, parent, registry, name, canonical) operate on this shape.
 */
export function domainsBase() {
  const parentDomain = alias(ensIndexerSchema.domain, "parentDomain");

  return (
    ensDb
      .select({
        domainId: sql<DomainId>`${ensIndexerSchema.domain.id}`.as("domainId"),
        ownerId: sql<NormalizedAddress | null>`${ensIndexerSchema.domain.ownerId}`.as("ownerId"),
        registryId: sql<RegistryId>`${ensIndexerSchema.domain.registryId}`.as("registryId"),
        parentId: sql<DomainId | null>`${parentDomain.id}`.as("parentId"),
        labelHash: sql<string>`${ensIndexerSchema.domain.labelHash}`.as("labelHash"),
        sortableLabel: sql<string | null>`${ensIndexerSchema.label.interpreted}`.as(
          "sortableLabel",
        ),
      })
      .from(ensIndexerSchema.domain)
      // parentId derivation: domain.registryId → canonical parent domain via registryCanonicalDomain.
      // The `parentDomain.subregistryId = domain.registryId` clause performs edge authentication.
      .leftJoin(
        ensIndexerSchema.registryCanonicalDomain,
        eq(ensIndexerSchema.registryCanonicalDomain.registryId, ensIndexerSchema.domain.registryId),
      )
      .leftJoin(
        parentDomain,
        and(
          eq(parentDomain.id, ensIndexerSchema.registryCanonicalDomain.domainId),
          eq(parentDomain.subregistryId, ensIndexerSchema.domain.registryId),
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
    labelHash: base.labelHash,
    sortableLabel: base.sortableLabel,
  };
}
