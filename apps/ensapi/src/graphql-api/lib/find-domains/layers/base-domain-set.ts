import { eq, sql } from "drizzle-orm";
import { alias, unionAll } from "drizzle-orm/pg-core";
import type { Address } from "viem";

import * as schema from "@ensnode/ensnode-schema";
import type { DomainId } from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

/**
 * Universal base domain set: all v1 and v2 domains with consistent metadata.
 *
 * Returns {domainId, ownerId, registryId, parentId, labelHash, sortableLabel} where:
 * - registryId is NULL for v1 domains (all v1 domains are canonical)
 * - v1 parentId comes directly from the v1Domain.parentId column
 * - v2 parentId is derived via canonical traversal: the v2Domain whose
 *   subregistryId equals this domain's registryId (one hop up the registry graph)
 * - sortableLabel is the domain's own interpreted label, used for NAME ordering.
 *   filterByName overrides this with the head domain's label when a concrete path is present.
 *
 * All downstream filters (owner, parent, registry, name, canonical) operate on this shape.
 */
export function domainsBase() {
  const v2ParentDomain = alias(schema.v2Domain, "v2ParentDomain");

  return unionAll(
    db
      .select({
        domainId: sql<DomainId>`${schema.v1Domain.id}`.as("domainId"),
        ownerId: sql<Address | null>`${schema.v1Domain.ownerId}`.as("ownerId"),
        registryId: sql<string | null>`NULL::text`.as("registryId"),
        parentId: sql<DomainId | null>`${schema.v1Domain.parentId}`.as("parentId"),
        labelHash: sql<string>`${schema.v1Domain.labelHash}`.as("labelHash"),
        sortableLabel: sql<string | null>`${schema.label.interpreted}`.as("sortableLabel"),
      })
      .from(schema.v1Domain)
      .leftJoin(schema.label, eq(schema.label.labelHash, schema.v1Domain.labelHash)),
    db
      .select({
        domainId: sql<DomainId>`${schema.v2Domain.id}`.as("domainId"),
        ownerId: sql<Address | null>`${schema.v2Domain.ownerId}`.as("ownerId"),
        registryId: sql<string | null>`${schema.v2Domain.registryId}`.as("registryId"),
        parentId: sql<DomainId | null>`${v2ParentDomain.id}`.as("parentId"),
        labelHash: sql<string>`${schema.v2Domain.labelHash}`.as("labelHash"),
        sortableLabel: sql<string | null>`${schema.label.interpreted}`.as("sortableLabel"),
      })
      .from(schema.v2Domain)
      .leftJoin(v2ParentDomain, eq(v2ParentDomain.subregistryId, schema.v2Domain.registryId))
      .leftJoin(schema.label, eq(schema.label.labelHash, schema.v2Domain.labelHash)),
  ).as("baseDomains");
}

/** The type of the base domain set subquery. */
export type BaseDomainSet = ReturnType<typeof domainsBase>;

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
