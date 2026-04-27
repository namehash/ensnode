import config from "@/config";

import { sql } from "drizzle-orm";

import { getRootRegistryIds } from "@ensnode/ensnode-sdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";

/**
 * The maximum depth to traverse the namegraph in order to construct the set of Canonical Registries.
 *
 * The CTE walks `domain.subregistryId` forward from every Root Registry. `subregistryId` is the
 * source-of-truth forward pointer, so no separate edge-authentication is needed — a Registry is
 * canonical iff it is reachable via a chain of live forward pointers from a Root.
 *
 * The reachable set is a DAG, not a tree: aliased subregistries let multiple parent Domains
 * declare the same child Registry, so the same row can appear at multiple depths during recursion.
 * The outer projection dedupes via `SELECT DISTINCT`; `MAX_DEPTH` bounds runaway recursion if the
 * graph is corrupted.
 */
const CANONICAL_REGISTRIES_MAX_DEPTH = 16;

/**
 * Builds a recursive CTE that traverses forward from every top-level Root Registry configured for
 * the namespace (all concrete ENSv1Registries plus the ENSv2 Root when defined) to construct a
 * set of all Canonical Registries.
 *
 * A Canonical Registry is one whose Domains are resolvable under the primary resolution pipeline.
 * This includes both the ENSv2 subtree and every ENSv1 subtree: Universal Resolver v2 falls back
 * to ENSv1 at resolution time for names not (yet) present in ENSv2, so ENSv1 Domains remain
 * canonical from a resolution perspective.
 *
 * TODO: could this be optimized further, perhaps as a materialized view?
 */
export const getCanonicalRegistriesCTE = () => {
  const roots = getRootRegistryIds(config.namespace);

  const rootsUnion = roots
    .map((root) => sql`SELECT ${root}::text AS registry_id, 0 AS depth`)
    .reduce((acc, part, i) => (i === 0 ? part : sql`${acc} UNION ALL ${part}`));

  return ensDb
    .select({
      // NOTE: using `id` here to avoid clobbering `registryId` in consuming queries, which would
      // result in '_ is ambiguous' error messages from postgres because drizzle isn't scoping the
      // selection properly. a bit fragile but works for now.
      id: sql<string>`registry_id`.as("id"),
    })
    .from(
      sql`
      (
        WITH RECURSIVE canonical_registries AS (
          ${rootsUnion}
          UNION ALL
          SELECT d.subregistry_id AS registry_id, cr.depth + 1
          FROM canonical_registries cr
          JOIN ${ensIndexerSchema.domain} d ON d.registry_id = cr.registry_id

          -- Filter nulls at the recursive step so Domains without a subregistry don't
          -- emit null rows into the CTE and don't spawn dead-end recursion branches.
          WHERE cr.depth < ${CANONICAL_REGISTRIES_MAX_DEPTH}
            AND d.subregistry_id IS NOT NULL
        )
        SELECT DISTINCT registry_id FROM canonical_registries
      ) AS canonical_registries_cte`,
    )
    .as("canonical_registries");
};
