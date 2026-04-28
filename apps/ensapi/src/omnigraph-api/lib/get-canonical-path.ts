import config from "@/config";

import { Param, sql } from "drizzle-orm";
import type { CanonicalPath, DomainId, RegistryId } from "enssdk";

import { getRootRegistryIds } from "@ensnode/ensnode-sdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";

const MAX_DEPTH = 16;

/**
 * Provide the canonical parents for a Domain via reverse traversal of the namegraph.
 *
 * Traversal walks `domain → registry → canonical parent domain` via the
 * {@link registryCanonicalDomain} table and terminates at any top-level Root Registry configured
 * for the namespace (all concrete ENSv1Registries plus the ENSv2 Root when defined). Returns
 * `null` when the resulting path does not terminate at a Root Registry (i.e. the Domain is not
 * canonical).
 */
export async function getCanonicalPath(domainId: DomainId): Promise<CanonicalPath | null> {
  const rootRegistryIds = getRootRegistryIds(config.namespace);

  // NOTE: using new Param to bind the array as a single text[] parameter, per
  // https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
  const rootRegistryIdsArray = sql`${new Param(rootRegistryIds)}::text[]`;

  const result = await ensDb.execute(sql`
    WITH RECURSIVE upward AS (
      -- Base case: start from the target domain
      SELECT
        d.id AS domain_id,
        d.registry_id,
        1 AS depth
      FROM ${ensIndexerSchema.domain} d
      WHERE d.id = ${domainId}

      UNION ALL

      -- Step upward: domain -> current registry's canonical domain (parent).
      --  1. Recursion stops as soon as we reach a Root Registry or there is no parent to traverse.
      --  2. MAX_DEPTH guards against corrupted state.
      --  3. The pd.subregistry_id = upward.registry_id clause performs edge authentication.
      SELECT
        pd.id AS domain_id,
        pd.registry_id,
        upward.depth + 1
      FROM upward
      JOIN ${ensIndexerSchema.registryCanonicalDomain} rcd
        ON rcd.registry_id = upward.registry_id
      JOIN ${ensIndexerSchema.domain} pd
        ON pd.id = rcd.domain_id AND pd.subregistry_id = upward.registry_id
      WHERE upward.depth < ${MAX_DEPTH}
        AND upward.registry_id <> ALL(${rootRegistryIdsArray})
    )
    SELECT *
    FROM upward
    ORDER BY depth;
  `);

  const rows = result.rows as { domain_id: DomainId; registry_id: RegistryId }[];

  if (rows.length === 0) {
    throw new Error(`Invariant(getCanonicalPath): DomainId '${domainId}' did not exist.`);
  }

  // Canonical iff the tip of the path terminates at any of the namespace's Root Registries.
  const tld = rows[rows.length - 1];
  const isCanonical = rootRegistryIds.includes(tld.registry_id);

  if (!isCanonical) return null;

  return rows.map((row) => row.domain_id);
}
