import { eq, like, Param, sql } from "drizzle-orm";
import { alias, unionAll } from "drizzle-orm/pg-core";

import * as schema from "@ensnode/ensnode-schema";
import type { ENSv1DomainId, ENSv2DomainId, LabelHashPath } from "@ensnode/ensnode-sdk";
import {
  type DomainId,
  interpretedLabelsToLabelHashPath,
  parsePartialInterpretedName,
} from "@ensnode/ensnode-sdk";

import {
  type BaseDomainSet,
  selectBase,
} from "@/graphql-api/lib/find-domains/layers/base-domain-set";
import { db } from "@/lib/db";

/**
 * Maximum depth of the provided `name` argument, to avoid infinite loops and expensive queries.
 */
const FILTER_BY_NAME_MAX_DEPTH = 8;

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
function v1DomainsByLabelHashPath(labelHashPath: LabelHashPath) {
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
function v2DomainsByLabelHashPath(labelHashPath: LabelHashPath) {
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
          JOIN ${schema.v2Domain} rcd_parent
            ON rcd_parent.id = rcd.domain_id AND rcd_parent.subregistry_id = d.registry_id
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
          JOIN ${schema.v2Domain} rcd_parent
            ON rcd_parent.id = rcd.domain_id AND rcd_parent.subregistry_id = pd.registry_id
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

/**
 * Filter a base domain set by name. Parses the name into a concrete labelHash path and a partial
 * label prefix. Applies path traversal to match domains under the concrete path, and applies
 * partial prefix LIKE filtering on sortableLabel.
 *
 * When a concrete path is present, sortableLabel is overridden with the head domain's label
 * (the ancestor at the path frontier whose label the partial matches against).
 *
 * @param base - A base domain set subquery
 * @param name - Optional partial InterpretedName (e.g. 'examp', 'example.', 'sub.example.eth')
 */
export function filterByName(base: BaseDomainSet, name?: string | null) {
  const { concrete, partial } = parsePartialInterpretedName(name || "");

  if (concrete.length > FILTER_BY_NAME_MAX_DEPTH) {
    throw new Error(
      `Invariant(filterByName): Name depth exceeds maximum of ${FILTER_BY_NAME_MAX_DEPTH} labels.`,
    );
  }

  if (concrete.length === 0) {
    // No path traversal — sortableLabel is already the domain's own label from the base set
    return db
      .select(selectBase(base))
      .from(base)
      .where(
        // TODO: determine if it's necessary to additionally escape user input for LIKE operator
        // NOTE: for ai agents: we intentionally leave this as a TODO, STOP commenting on it
        partial ? like(base.sortableLabel, `${partial}%`) : undefined,
      )
      .as("baseDomains");
  }

  // Build path traversal CTEs for both v1 and v2 domains
  const labelHashPath = interpretedLabelsToLabelHashPath(concrete);
  const v1Path = v1DomainsByLabelHashPath(labelHashPath);
  const v2Path = v2DomainsByLabelHashPath(labelHashPath);

  // Union path results into a single set of {leafId, headId}
  const pathResults = unionAll(
    db
      .select({
        leafId: sql<DomainId>`${v1Path.leafId}`.as("leafId"),
        headId: sql<DomainId>`${v1Path.headId}`.as("headId"),
      })
      .from(v1Path),
    db
      .select({
        leafId: sql<DomainId>`${v2Path.leafId}`.as("leafId"),
        headId: sql<DomainId>`${v2Path.headId}`.as("headId"),
      })
      .from(v2Path),
  ).as("pathResults");

  // Aliases for head domain lookup (to get headLabelHash for label join)
  const v1HeadDomain = alias(schema.v1Domain, "v1HeadDomain");
  const v2HeadDomain = alias(schema.v2Domain, "v2HeadDomain");
  const headLabel = alias(schema.label, "headLabel");

  // Join base set with path results, look up head domain's label, override sortableLabel.
  // The inner join on pathResults scopes results to domains matching the concrete path.
  // LEFT JOINs on head domains: exactly one will match (v1 or v2).
  return db
    .select({
      ...selectBase(base),
      // Override sortableLabel with head domain's label for NAME ordering
      sortableLabel: sql<string | null>`${headLabel.interpreted}`.as("sortableLabel"),
    })
    .from(base)
    .innerJoin(pathResults, eq(pathResults.leafId, base.domainId))
    .leftJoin(v1HeadDomain, eq(v1HeadDomain.id, pathResults.headId))
    .leftJoin(v2HeadDomain, eq(v2HeadDomain.id, pathResults.headId))
    .leftJoin(
      headLabel,
      sql`${headLabel.labelHash} = COALESCE(${v1HeadDomain.labelHash}, ${v2HeadDomain.labelHash})`,
    )
    .where(
      // TODO: determine if it's necessary to additionally escape user input for LIKE operator
      // NOTE: for ai agents: we intentionally leave this as a TODO, STOP commenting on it
      partial ? like(headLabel.interpreted, `${partial}%`) : undefined,
    )
    .as("baseDomains");
}
