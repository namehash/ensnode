import { and, eq, sql } from "drizzle-orm";
import { alias, unionAll } from "drizzle-orm/pg-core";
import type { Address } from "viem";

import type { DomainId } from "@ensnode/ensnode-sdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";

/**
 * The type of the base domain set subquery.
 */
export type BaseDomainSet = ReturnType<typeof domainsBase>;

/**
 * Universal base domain set: all v1 and v2 domains with consistent metadata.
 *
 * Returns {domainId, ownerId, registryId, parentId, labelHash, sortableLabel} where:
 * - registryId is NULL for v1 domains (all v1 domains are canonical)
 * - v1 parentId comes directly from the v1Domain.parentId column
 * - v2 parentId is derived via canonical registry traversal: look up the canonical domain
 *   for this domain's registry (via registryCanonicalDomain), then verify the reverse pointer
 *   (parent.subregistryId = child.registryId). See getV2CanonicalPath for the recursive version.
 * - sortableLabel is the domain's own interpreted label, used for NAME ordering, which can be
 *   overridden by future layers.
 *
 * All downstream filters (owner, parent, registry, name, canonical) operate on this shape.
 */
export function domainsBase() {
  const v2ParentDomain = alias(ensIndexerSchema.v2Domain, "v2ParentDomain");

  return unionAll(
    ensDb
      .select({
        domainId: sql<DomainId>`${ensIndexerSchema.v1Domain.id}`.as("domainId"),
        ownerId: sql<Address | null>`${ensIndexerSchema.v1Domain.ownerId}`.as("ownerId"),
        registryId: sql<string | null>`NULL::text`.as("registryId"),
        parentId: sql<DomainId | null>`${ensIndexerSchema.v1Domain.parentId}`.as("parentId"),
        labelHash: sql<string>`${ensIndexerSchema.v1Domain.labelHash}`.as("labelHash"),
        sortableLabel: sql<string | null>`${ensIndexerSchema.label.interpreted}`.as(
          "sortableLabel",
        ),
      })
      .from(ensIndexerSchema.v1Domain)
      .leftJoin(
        ensIndexerSchema.label,
        eq(ensIndexerSchema.label.labelHash, ensIndexerSchema.v1Domain.labelHash),
      ),
    ensDb
      .select({
        domainId: sql<DomainId>`${ensIndexerSchema.v2Domain.id}`.as("domainId"),
        ownerId: sql<Address | null>`${ensIndexerSchema.v2Domain.ownerId}`.as("ownerId"),
        registryId: sql<string | null>`${ensIndexerSchema.v2Domain.registryId}`.as("registryId"),
        parentId: sql<DomainId | null>`${v2ParentDomain.id}`.as("parentId"),
        labelHash: sql<string>`${ensIndexerSchema.v2Domain.labelHash}`.as("labelHash"),
        sortableLabel: sql<string | null>`${ensIndexerSchema.label.interpreted}`.as(
          "sortableLabel",
        ),
      })
      .from(ensIndexerSchema.v2Domain)
      // derive v2 parentId via canonical registry traversal:
      // 1. find the canonical domain for this domain's registry
      .leftJoin(
        ensIndexerSchema.registryCanonicalDomain,
        eq(
          ensIndexerSchema.registryCanonicalDomain.registryId,
          ensIndexerSchema.v2Domain.registryId,
        ),
      )
      // 2. verify the reverse pointer: parent.id = rcd.domainId AND parent.subregistryId = child.registryId
      .leftJoin(
        v2ParentDomain,
        and(
          eq(v2ParentDomain.id, ensIndexerSchema.registryCanonicalDomain.domainId),
          eq(v2ParentDomain.subregistryId, ensIndexerSchema.v2Domain.registryId),
        ),
      )
      .leftJoin(
        ensIndexerSchema.label,
        eq(ensIndexerSchema.label.labelHash, ensIndexerSchema.v2Domain.labelHash),
      ),
  ).as("baseDomains");
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
