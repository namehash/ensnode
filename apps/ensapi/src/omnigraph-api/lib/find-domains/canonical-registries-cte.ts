import config from "@/config";

import { sql } from "drizzle-orm";

import { getENSv1RootRegistryId, maybeGetENSv2RootRegistryId } from "@ensnode/ensnode-sdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { lazy } from "@/lib/lazy";

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

const getV1Root = lazy(() => getENSv1RootRegistryId(config.namespace));
const getV2Root = lazy(() => maybeGetENSv2RootRegistryId(config.namespace));

/**
 * Builds a recursive CTE that traverses forward from the ENSv1 root Registry and (when defined)
 * the ENSv2 root Registry to construct a set of all Canonical Registries.
 *
 * A Canonical Registry is one whose Domains are resolvable under the primary resolution pipeline.
 * This includes both the ENSv2 subtree and the ENSv1 subtree: Universal Resolver v2 falls back to
 * ENSv1 at resolution time for names not (yet) present in ENSv2, so ENSv1 Domains remain canonical
 * from a resolution perspective.
 *
 * Both ENSv1 and ENSv2 Domains set `subregistryId` (ENSv1 Domains to their managed ENSv1
 * VirtualRegistry, ENSv2 Domains to their declared Subregistry), so a single recursive step over
 * `domain.subregistryId` covers both lineages.
 *
 * TODO: could this be optimized further, perhaps as a materialized view?
 */
export const getCanonicalRegistriesCTE = () => {
  const v1Root = getV1Root();
  const v2Root = getV2Root();

  // TODO: this can be streamlined into a single union once ENSv2Root is available in all namespaces
  const rootsUnion = v2Root
    ? sql`SELECT ${v1Root}::text AS registry_id, 0 AS depth
          UNION ALL
          SELECT ${v2Root}::text AS registry_id, 0 AS depth`
    : sql`SELECT ${v1Root}::text AS registry_id, 0 AS depth`;

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
          WHERE cr.depth < ${CANONICAL_REGISTRIES_MAX_DEPTH}
        )
        SELECT registry_id FROM canonical_registries WHERE registry_id IS NOT NULL
      ) AS canonical_registries_cte`,
    )
    .as("canonical_registries");
};
