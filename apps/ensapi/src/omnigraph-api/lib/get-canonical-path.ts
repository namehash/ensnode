import config from "@/config";

import { sql } from "drizzle-orm";
import {
  type CanonicalPath,
  type DomainId,
  ENS_ROOT_NODE,
  type ENSv1DomainId,
  type ENSv2DomainId,
  type RegistryId,
} from "enssdk";

import { maybeGetENSv2RootRegistryId } from "@ensnode/ensnode-sdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { lazy } from "@/lib/lazy";

const MAX_DEPTH = 16;
// lazy() defers construction until first use so that this module can be
// imported without env vars being present (e.g. during OpenAPI generation).
const getENSv2RootRegistryId = lazy(() => maybeGetENSv2RootRegistryId(config.namespace));

/**
 * Provide the canonical parents for an ENSv1 Domain.
 *
 * i.e. reverse traversal of the nametree
 */
export async function getV1CanonicalPath(domainId: ENSv1DomainId): Promise<CanonicalPath | null> {
  const result = await ensDb.execute(sql`
    WITH RECURSIVE upward AS (
      -- Base case: start from the target domain
      SELECT
        d.id AS domain_id,
        d.parent_id,
        d.label_hash,
        1 AS depth
      FROM ${ensIndexerSchema.v1Domain} d
      WHERE d.id = ${domainId}

      UNION ALL

      -- Step upward: domain -> parent domain
      SELECT
        pd.id AS domain_id,
        pd.parent_id,
        pd.label_hash,
        upward.depth + 1
      FROM upward
      JOIN ${ensIndexerSchema.v1Domain} pd
        ON pd.id = upward.parent_id
      WHERE upward.depth < ${MAX_DEPTH}
    )
    SELECT *
    FROM upward
    ORDER BY depth;
  `);

  const rows = result.rows as { domain_id: ENSv1DomainId; parent_id: ENSv1DomainId }[];

  if (rows.length === 0) {
    throw new Error(`Invariant(getCanonicalPath): DomainId '${domainId}' did not exist.`);
  }

  // v1Domains are canonical if the TLD's parent is ENS_ROOT_NODE (ENS_ROOT_NODE itself does not exist in the index)
  const tld = rows[rows.length - 1];
  const isCanonical = tld.parent_id === ENS_ROOT_NODE;

  if (!isCanonical) return null;

  return rows.map((row) => row.domain_id);
}

/**
 * Provide the canonical parents for an ENSv2 Domain.
 *
 * i.e. reverse traversal of the namegraph via registry_canonical_domains
 */
export async function getV2CanonicalPath(domainId: ENSv2DomainId): Promise<CanonicalPath | null> {
  const rootRegistryId = getENSv2RootRegistryId();

  // if the ENSv2 Root Registry is not defined, null
  if (!rootRegistryId) return null;

  const result = await ensDb.execute(sql`
    WITH RECURSIVE upward AS (
      -- Base case: start from the target domain
      SELECT
        d.id AS domain_id,
        d.registry_id,
        d.label_hash,
        1 AS depth
      FROM ${ensIndexerSchema.v2Domain} d
      WHERE d.id = ${domainId}

      UNION ALL

      -- Step upward: domain -> registry -> canonical parent domain
      SELECT
        pd.id AS domain_id,
        pd.registry_id,
        pd.label_hash,
        upward.depth + 1
      FROM upward
      JOIN ${ensIndexerSchema.registryCanonicalDomain} rcd
        ON rcd.registry_id = upward.registry_id
      JOIN ${ensIndexerSchema.v2Domain} pd
        ON pd.id = rcd.domain_id AND pd.subregistry_id = upward.registry_id
      WHERE upward.registry_id != ${rootRegistryId}
        AND upward.depth < ${MAX_DEPTH}
    )
    SELECT *
    FROM upward
    ORDER BY depth;
  `);

  const rows = result.rows as { domain_id: DomainId; registry_id: RegistryId }[];

  if (rows.length === 0) {
    throw new Error(`Invariant(getCanonicalPath): DomainId '${domainId}' did not exist.`);
  }

  const tld = rows[rows.length - 1];
  const isCanonical = tld.registry_id === rootRegistryId;

  if (!isCanonical) return null;

  return rows.map((row) => row.domain_id);
}
