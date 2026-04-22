import config from "@/config";

import { sql } from "drizzle-orm";
import type { CanonicalPath, DomainId, RegistryId } from "enssdk";

import { getENSv1RootRegistryId, maybeGetENSv2RootRegistryId } from "@ensnode/ensnode-sdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { lazy } from "@/lib/lazy";

const MAX_DEPTH = 16;

// lazy() defers construction until first use so that this module can be imported without env vars
// being present (e.g. during OpenAPI generation).
const getV1Root = lazy(() => getENSv1RootRegistryId(config.namespace));
const getV2Root = lazy(() => maybeGetENSv2RootRegistryId(config.namespace));

/**
 * Provide the canonical parents for a Domain via reverse traversal of the namegraph.
 *
 * Traversal walks `domain → registry → canonical parent domain` via the
 * {@link registryCanonicalDomain} table and terminates at either the namespace's v1 root Registry
 * or its v2 root Registry. Returns `null` when the resulting path does not terminate at a
 * root Registry (i.e. the Domain is not canonical).
 */
export async function getCanonicalPath(domainId: DomainId): Promise<CanonicalPath | null> {
  const v1Root = getV1Root();
  const v2Root = getV2Root();

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
      -- Recursion terminates naturally: roots have no registryCanonicalDomain entry, so the
      -- JOIN on rcd fails when we reach one. MAX_DEPTH guards against corrupted state. The
      -- pd.subregistry_id = upward.registry_id clause performs edge authentication.
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
    )
    SELECT *
    FROM upward
    ORDER BY depth;
  `);

  const rows = result.rows as { domain_id: DomainId; registry_id: RegistryId }[];

  if (rows.length === 0) {
    throw new Error(`Invariant(getCanonicalPath): DomainId '${domainId}' did not exist.`);
  }

  // Canonical iff the tip of the path terminates at a root Registry. When v2Root is undefined
  // (namespace without ENSv2), the `=== v2Root` comparison is false and only v1 paths qualify.
  const tld = rows[rows.length - 1];
  const isCanonical = tld.registry_id === v1Root || tld.registry_id === v2Root;

  if (!isCanonical) return null;

  return rows.map((row) => row.domain_id);
}
