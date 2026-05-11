import config from "@/config";

import { eq, Param, sql } from "drizzle-orm";
import {
  type DomainId,
  type InterpretedName,
  interpretedLabelsToLabelHashPath,
  interpretedNameToInterpretedLabels,
  type LabelHashPath,
  type RegistryId,
} from "enssdk";

import { getENSv1RootRegistryId, maybeGetENSv2RootRegistryId } from "@ensnode/ensnode-sdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";

import { type BaseDomainSet, selectBase } from "./base-domain-set";

/**
 * Maximum depth of each name in `filterByNameIn`, to avoid expensive queries.
 */
const FILTER_BY_NAME_IN_MAX_DEPTH = 8;

/**
 * Maximum number of names accepted by `filterByNameIn` in a single request.
 */
export const FILTER_BY_NAME_IN_MAX_NAMES = 100;

/**
 * The Root Registry IDs for the configured namespace (ENSv1 always, ENSv2 when defined).
 * A Domain qualifies as an exact-name match for an N-label path only if its topmost matched
 * ancestor lives in one of these root registries (i.e. the leaf is at depth exactly N from a
 * canonical root).
 */
function getRootRegistryIds(): RegistryId[] {
  const v1 = getENSv1RootRegistryId(config.namespace);
  const v2 = maybeGetENSv2RootRegistryId(config.namespace);
  return v2 ? [v1, v2] : [v1];
}

function namesToLabelHashPaths(names: InterpretedName[]): LabelHashPath[] {
  return names.map((name) => {
    const labels = interpretedNameToInterpretedLabels(name);
    if (labels.length === 0) {
      throw new Error(
        `Invariant(filterByNameIn): the ENS Root Name ('') is not addressable in this filter.`,
      );
    }
    if (labels.length > FILTER_BY_NAME_IN_MAX_DEPTH) {
      throw new Error(
        `Invariant(filterByNameIn): Name '${name}' depth exceeds maximum of ${FILTER_BY_NAME_IN_MAX_DEPTH} labels.`,
      );
    }
    return interpretedLabelsToLabelHashPath(labels);
  });
}

/**
 * Build a subquery returning the leaf Domain IDs whose ancestry in the canonical tree exactly
 * matches one of the input label hash paths.
 *
 * Uses a single multi-path recursive CTE: input paths are encoded as a `(path_id, position,
 * label_hash)` relation; each path is walked up from its leaf via the bidirectional
 * canonical-edge agreement check (`registries.canonical_domain_id = domains.id` AND
 * `domains.subregistry_id = registries.id`), verifying each ancestor's labelHash matches the
 * expected position in the path. A path matches when `depth = path length` AND the topmost
 * matched ancestor lives in one of the namespace's root registries — the latter constraint
 * enforces depth correctness so that a 1-label path like 'eth' does not match a same-labeled
 * descendant deeper in some other canonical tree.
 */
function domainsByExactLabelHashPaths(labelHashPaths: LabelHashPath[]) {
  // encode the input paths as a jsonb 2D array — each path may have a different length, so a
  // flat text[] won't do.
  const pathsJson = sql`${new Param(JSON.stringify(labelHashPaths))}::jsonb`;
  const rootRegistryIds = sql`${new Param(getRootRegistryIds())}::text[]`;

  return ensDb
    .select({ leafId: sql<DomainId>`exact_path_match.leaf_id`.as("leafId") })
    .from(
      sql`(
        WITH RECURSIVE
          path_input AS (
            SELECT
              (p.path_idx - 1)::int AS path_id,
              l.label_idx::int      AS position,
              l.label_hash::text    AS label_hash
            FROM jsonb_array_elements(${pathsJson}) WITH ORDINALITY p(path, path_idx)
            CROSS JOIN LATERAL jsonb_array_elements_text(p.path)
              WITH ORDINALITY l(label_hash, label_idx)
          ),
          path_length AS (
            SELECT path_id, MAX(position) AS length
            FROM path_input
            GROUP BY path_id
          ),
          upward_check AS (
            -- Base case: leaf candidates matching the deepest label of each path
            SELECT
              pi.path_id,
              d.id AS leaf_id,
              d.id AS current_id,
              1    AS depth
            FROM path_input pi
            JOIN path_length pl
              ON pl.path_id = pi.path_id AND pi.position = pl.length
            JOIN ${ensIndexerSchema.domain} d
              ON d.label_hash = pi.label_hash

            UNION ALL

            -- Recursive step: walk up via the agreement check, verifying each ancestor's labelHash
            -- against the expected position in the path.
            SELECT
              uc.path_id,
              uc.leaf_id,
              np.id AS current_id,
              uc.depth + 1
            FROM upward_check uc
            JOIN path_length pl ON pl.path_id = uc.path_id
            JOIN ${ensIndexerSchema.domain} cur ON cur.id = uc.current_id
            JOIN ${ensIndexerSchema.registry} cur_reg ON cur_reg.id = cur.registry_id
            JOIN ${ensIndexerSchema.domain} np
              ON np.id = cur_reg.canonical_domain_id
             AND np.subregistry_id = cur_reg.id
            JOIN path_input pi
              ON pi.path_id = uc.path_id
             AND pi.position = pl.length - uc.depth
             AND np.label_hash = pi.label_hash
            WHERE uc.depth < pl.length
          )
        SELECT DISTINCT uc.leaf_id
        FROM upward_check uc
        JOIN path_length pl ON pl.path_id = uc.path_id
        JOIN ${ensIndexerSchema.domain} top ON top.id = uc.current_id
        WHERE uc.depth = pl.length
          AND top.registry_id = ANY(${rootRegistryIds})
      ) AS exact_path_match`,
    )
    .as("exact_path_match");
}

/**
 * Filter a base domain set to only Domains whose Interpreted Name exactly matches one of
 * `names`, considering ancestry in the canonical tree.
 *
 * Returns an empty result set if `names` is empty.
 *
 * @param base - A base domain set subquery
 * @param names - Exact InterpretedNames to match against
 */
export function filterByNameIn(base: BaseDomainSet, names: InterpretedName[]) {
  if (names.length === 0) {
    return ensDb.select(selectBase(base)).from(base).where(sql`false`).as("baseDomains");
  }

  const labelHashPaths = namesToLabelHashPaths(names);
  const pathResults = domainsByExactLabelHashPaths(labelHashPaths);

  return ensDb
    .select(selectBase(base))
    .from(base)
    .innerJoin(pathResults, eq(pathResults.leafId, base.domainId))
    .as("baseDomains");
}
