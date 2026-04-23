import config from "@/config";

import { sql } from "drizzle-orm";

import { getRootRegistryIds } from "@ensnode/ensnode-sdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";

/**
 * The maximum depth to traverse the namegraph in order to construct the set of Canonical Registries.
 *
 * Note that the set of Canonical Registries is a _tree_ by construction: each Registry is reached
 * via either `registryCanonicalDomain` (ENSv1 virtual / ENSv2) or the concrete ENSv1 root.
 * Edge authentication (parent's `subregistryId` matches the child's `registryId`) prevents
 * cycles in the declared namegraph.
 *
 * So while technically not necessary, including the depth constraint avoids the possibility of an
 * infinite runaway query in the event that the indexed namegraph is somehow corrupted or otherwise
 * introduces a canonical cycle.
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
 * Both ENSv1 and ENSv2 Domains set `subregistryId` (ENSv1 Domains to their managed ENSv1
 * VirtualRegistry, ENSv2 Domains to their declared Subregistry), so a single recursive step over
 * `domain.subregistryId` covers both lineages.
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
          -- Filter nulls at the recursive step so terminal Domains (no subregistry declared) don't
          -- emit null rows into the CTE and don't spawn dead-end recursion branches.
          SELECT d.subregistry_id AS registry_id, cr.depth + 1
          FROM canonical_registries cr
          JOIN ${ensIndexerSchema.domain} d ON d.registry_id = cr.registry_id
          WHERE cr.depth < ${CANONICAL_REGISTRIES_MAX_DEPTH}
            AND d.subregistry_id IS NOT NULL
        )
        SELECT registry_id FROM canonical_registries
      ) AS canonical_registries_cte`,
    )
    .as("canonical_registries");
};
