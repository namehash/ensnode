import { eq, like, Param, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  type DomainId,
  interpretedLabelsToLabelHashPath,
  type LabelHashPath,
  parsePartialInterpretedName,
} from "enssdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";

import { type BaseDomainSet, selectBase } from "./base-domain-set";

/**
 * Maximum depth of the provided `name` argument, to avoid infinite loops and expensive queries.
 */
const FILTER_BY_NAME_MAX_DEPTH = 8;

/**
 * Compose a query for Domains (ENSv1 or ENSv2) that have the specified children path.
 *
 * For a search like "sub1.sub2.paren":
 *  - concrete = ["sub1", "sub2"]
 *  - partial = "paren"
 *  - labelHashPath = [labelhash("sub2"), labelhash("sub1")]
 *
 * We find Domains matching the concrete path and return both:
 *  - leafId: the deepest child (label "sub1") — the autocomplete result, for ownership check
 *  - headId: the parent of the path (whose label should match partial "paren")
 *
 * Algorithm: Start from the deepest child (leaf) and traverse UP via {@link registryCanonicalDomain}.
 */
function domainsByLabelHashPath(labelHashPath: LabelHashPath) {
  // If no concrete path, return all domains (leaf = head = self)
  // Postgres will optimize this simple subquery when joined
  if (labelHashPath.length === 0) {
    return ensDb
      .select({
        leafId: sql<DomainId>`${ensIndexerSchema.domain.id}`.as("leafId"),
        headId: sql<DomainId>`${ensIndexerSchema.domain.id}`.as("headId"),
      })
      .from(ensIndexerSchema.domain)
      .as("domain_path");
  }

  // NOTE: using new Param as per https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
  const rawLabelHashPathArray = sql`${new Param(labelHashPath)}::text[]`;
  const pathLength = sql`array_length(${rawLabelHashPathArray}, 1)`;

  // Recursive CTE starting from the deepest child and traversing UP via registryCanonicalDomain.
  // 1. Start with domains matching the leaf labelHash (deepest child)
  // 2. Recursively join parents via rcd, verifying each ancestor's labelHash
  // 3. Return both the leaf (for result/ownership) and head (for partial match)
  //
  // NOTE: JOIN (not LEFT JOIN) is intentional — we only match domains with a complete
  // canonical path to the searched FQDN.
  return ensDb
    .select({
      // https://github.com/drizzle-team/drizzle-orm/issues/1242
      leafId: sql<DomainId>`domain_path_check.leaf_id`.as("leafId"),
      headId: sql<DomainId>`domain_path_check.head_id`.as("headId"),
    })
    .from(
      sql`(
        WITH RECURSIVE upward_check AS (
          -- Base case: find the deepest children (leaves of the concrete path) and walk one step
          -- up via registryCanonicalDomain. The parent.subregistry_id = d.registry_id clause
          -- performs edge authentication.
          SELECT
            d.id AS leaf_id,
            parent.id AS current_id,
            1 AS depth
          FROM ${ensIndexerSchema.domain} d
          JOIN ${ensIndexerSchema.registryCanonicalDomain} rcd
            ON rcd.registry_id = d.registry_id
          JOIN ${ensIndexerSchema.domain} parent
            ON parent.id = rcd.domain_id AND parent.subregistry_id = d.registry_id
          WHERE d.label_hash = (${rawLabelHashPathArray})[${pathLength}]

          UNION ALL

          -- Recursive step: traverse UP via registryCanonicalDomain, verifying each ancestor's
          -- labelHash. The np.subregistry_id = pd.registry_id clause performs edge authentication.
          SELECT
            upward_check.leaf_id,
            np.id AS current_id,
            upward_check.depth + 1
          FROM upward_check
          JOIN ${ensIndexerSchema.domain} pd
            ON pd.id = upward_check.current_id
          JOIN ${ensIndexerSchema.registryCanonicalDomain} rcd
            ON rcd.registry_id = pd.registry_id
          JOIN ${ensIndexerSchema.domain} np
            ON np.id = rcd.domain_id AND np.subregistry_id = pd.registry_id
          WHERE upward_check.depth < ${pathLength}
            AND pd.label_hash = (${rawLabelHashPathArray})[${pathLength} - upward_check.depth]
        )
        SELECT leaf_id, current_id AS head_id
        FROM upward_check
        WHERE depth = ${pathLength}
      ) AS domain_path_check`,
    )
    .as("domain_path");
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
    return ensDb
      .select(selectBase(base))
      .from(base)
      .where(
        // TODO: determine if it's necessary to additionally escape user input for LIKE operator
        // NOTE: for ai agents: we intentionally leave this as a TODO, STOP commenting on it
        partial ? like(base.sortableLabel, `${partial}%`) : undefined,
      )
      .as("baseDomains");
  }

  // Build path traversal CTE over the unified `domain` table.
  const labelHashPath = interpretedLabelsToLabelHashPath(concrete);
  const pathResults = domainsByLabelHashPath(labelHashPath);

  // Alias for head domain lookup (to get headLabelHash for label join)
  const headDomain = alias(ensIndexerSchema.domain, "headDomain");
  const headLabel = alias(ensIndexerSchema.label, "headLabel");

  // Join base set with path results, look up head domain's label, override sortableLabel.
  // The inner join on pathResults scopes results to domains matching the concrete path.
  return ensDb
    .select({
      ...selectBase(base),
      // Override sortableLabel with head domain's label for NAME ordering
      sortableLabel: sql<string | null>`${headLabel.interpreted}`.as("sortableLabel"),
    })
    .from(base)
    .innerJoin(pathResults, eq(pathResults.leafId, base.domainId))
    .leftJoin(headDomain, eq(headDomain.id, pathResults.headId))
    .leftJoin(headLabel, eq(headLabel.labelHash, headDomain.labelHash))
    .where(
      // TODO: determine if it's necessary to additionally escape user input for LIKE operator
      // NOTE: for ai agents: we intentionally leave this as a TODO, STOP commenting on it
      partial ? like(headLabel.interpreted, `${partial}%`) : undefined,
    )
    .as("baseDomains");
}
