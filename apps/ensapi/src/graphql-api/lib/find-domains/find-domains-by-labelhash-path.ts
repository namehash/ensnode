import { Param, sql } from "drizzle-orm";

import * as schema from "@ensnode/ensnode-schema";
import type { ENSv1DomainId, ENSv2DomainId, LabelHashPath } from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

/**
 * Compose a query for v1Domains that have the specified children path.
 *
 * For a search like "sub1.sub2.paren":
 *  - concrete = ["sub1", "sub2"]
 *  - partial = 'paren'
 *  - labelHashPath = [labelhash('sub2'), labelhash('sub1')]
 *
 * We find v1Domains matching the concrete path and return both:
 *  - leafId: the deepest child (label "sub1") - the autocomplete result, for ownership check
 *  - headId: the parent of the path (whose label should match partial "paren")
 *
 * Algorithm: Start from the deepest child (leaf) and traverse UP to find the head.
 * This is more efficient than starting from all domains and traversing down.
 */
export function v1DomainsByLabelHashPath(labelHashPath: LabelHashPath) {
  // If no concrete path, return all domains (leaf = head = self)
  // Postgres will optimize this simple subquery when joined
  if (labelHashPath.length === 0) {
    return db
      .select({
        leafId: sql<ENSv1DomainId>`${schema.v1Domain.id}`.as("leafId"),
        headId: sql<ENSv1DomainId>`${schema.v1Domain.id}`.as("headId"),
      })
      .from(schema.v1Domain)
      .as("v1_path");
  }

  // NOTE: using new Param as per https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
  const rawLabelHashPathArray = sql`${new Param(labelHashPath)}::text[]`;
  const pathLength = sql`array_length(${rawLabelHashPathArray}, 1)`;

  // Use a recursive CTE starting from the deepest child and traversing UP
  // The query:
  // 1. Starts with domains matching the leaf labelHash (deepest child)
  // 2. Recursively joins parents, verifying each ancestor's labelHash
  // 3. Returns both the leaf (for result/ownership) and head (for partial match)
  return db
    .select({
      // https://github.com/drizzle-team/drizzle-orm/issues/1242
      leafId: sql<ENSv1DomainId>`v1_path_check.leaf_id`.as("leafId"),
      headId: sql<ENSv1DomainId>`v1_path_check.head_id`.as("headId"),
    })
    .from(
      sql`(
        WITH RECURSIVE upward_check AS (
          -- Base case: find the deepest children (leaves of the concrete path)
          SELECT
            d.id AS leaf_id,
            d.parent_id AS current_id,
            1 AS depth
          FROM ${schema.v1Domain} d
          WHERE d.label_hash = (${rawLabelHashPathArray})[${pathLength}]

          UNION ALL

          -- Recursive step: traverse UP, verifying each ancestor's labelHash
          SELECT
            upward_check.leaf_id,
            pd.parent_id AS current_id,
            upward_check.depth + 1
          FROM upward_check
          JOIN ${schema.v1Domain} pd
            ON pd.id = upward_check.current_id
          WHERE upward_check.depth < ${pathLength}
            AND pd.label_hash = (${rawLabelHashPathArray})[${pathLength} - upward_check.depth]
        )
        SELECT leaf_id, current_id AS head_id
        FROM upward_check
        WHERE depth = ${pathLength}
      ) AS v1_path_check`,
    )
    .as("v1_path");
}

/**
 * Compose a query for v2Domains that have the specified children path.
 *
 * For a search like "sub1.sub2.paren":
 *  - concrete = ["sub1", "sub2"]
 *  - partial = 'paren'
 *  - labelHashPath = [labelhash('sub2'), labelhash('sub1')]
 *
 * We find v2Domains matching the concrete path and return both:
 *  - leafId: the deepest child (label "sub1") - the autocomplete result, for ownership check
 *  - headId: the parent of the path (whose label should match partial "paren")
 *
 * Algorithm: Start from the deepest child (leaf) and traverse UP via registryCanonicalDomain.
 * For v2, parent relationship is: domain.registryId -> registryCanonicalDomain -> parent domainId
 */
export function v2DomainsByLabelHashPath(labelHashPath: LabelHashPath) {
  // If no concrete path, return all domains (leaf = head = self)
  // Postgres will optimize this simple subquery when joined
  if (labelHashPath.length === 0) {
    return db
      .select({
        leafId: sql<ENSv2DomainId>`${schema.v2Domain.id}`.as("leafId"),
        headId: sql<ENSv2DomainId>`${schema.v2Domain.id}`.as("headId"),
      })
      .from(schema.v2Domain)
      .as("v2_path");
  }

  // NOTE: using new Param as per https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
  const rawLabelHashPathArray = sql`${new Param(labelHashPath)}::text[]`;
  const pathLength = sql`array_length(${rawLabelHashPathArray}, 1)`;

  // Use a recursive CTE starting from the deepest child and traversing UP
  // The query:
  // 1. Starts with domains matching the leaf labelHash (deepest child)
  // 2. Recursively joins parents via registryCanonicalDomain, verifying each ancestor's labelHash
  // 3. Returns both the leaf (for result/ownership) and head (for partial match)
  return db
    .select({
      // https://github.com/drizzle-team/drizzle-orm/issues/1242
      leafId: sql<ENSv2DomainId>`v2_path_check.leaf_id`.as("leafId"),
      headId: sql<ENSv2DomainId>`v2_path_check.head_id`.as("headId"),
    })
    .from(
      sql`(
        WITH RECURSIVE upward_check AS (
          -- Base case: find the deepest children (leaves of the concrete path)
          -- and get their parent via registryCanonicalDomain
          -- Note: JOIN (not LEFT JOIN) is intentional - we only match domains
          -- with a complete canonical path to the searched FQDN
          SELECT
            d.id AS leaf_id,
            rcd.domain_id AS current_id,
            1 AS depth
          FROM ${schema.v2Domain} d
          JOIN ${schema.registryCanonicalDomain} rcd
            ON rcd.registry_id = d.registry_id
          WHERE d.label_hash = (${rawLabelHashPathArray})[${pathLength}]

          UNION ALL

          -- Recursive step: traverse UP via registryCanonicalDomain
          -- Note: JOIN (not LEFT JOIN) is intentional - see base case comment
          SELECT
            upward_check.leaf_id,
            rcd.domain_id AS current_id,
            upward_check.depth + 1
          FROM upward_check
          JOIN ${schema.v2Domain} pd
            ON pd.id = upward_check.current_id
          JOIN ${schema.registryCanonicalDomain} rcd
            ON rcd.registry_id = pd.registry_id
          WHERE upward_check.depth < ${pathLength}
            AND pd.label_hash = (${rawLabelHashPathArray})[${pathLength} - upward_check.depth]
        )
        SELECT leaf_id, current_id AS head_id
        FROM upward_check
        WHERE depth = ${pathLength}
      ) AS v2_path_check`,
    )
    .as("v2_path");
}
