import config from "@/config";

import { sql } from "drizzle-orm";

import * as schema from "@ensnode/ensnode-schema";
import {
  type CanonicalPath,
  type DomainId,
  type ENSv1DomainId,
  type ENSv2DomainId,
  getENSv2RootRegistryId,
  type RegistryId,
  ROOT_NODE,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

const MAX_DEPTH = 16;
const ENSv2_ROOT_REGISTRY_ID = getENSv2RootRegistryId(config.namespace);

/**
 * Provide the canonical parents for an ENSv1 Domain.
 *
 * i.e. reverse traversal of the nametree
 */
export async function getV1CanonicalPath(domainId: ENSv1DomainId): Promise<CanonicalPath | null> {
  const result = await db.execute(sql`
    WITH RECURSIVE upward AS (
      -- Base case: start from the target domain
      SELECT
        d.id AS domain_id,
        d.parent_id,
        d.label_hash,
        1 AS depth
      FROM ${schema.v1Domain} d
      WHERE d.id = ${domainId}

      UNION ALL

      -- Step upward: domain -> parent domain
      SELECT
        pd.id AS domain_id,
        pd.parent_id,
        pd.label_hash,
        upward.depth + 1
      FROM upward
      JOIN ${schema.v1Domain} pd
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

  // v1Domains are canonical if the TLD's parent is ROOT_NODE (ROOT_NODE itself does not exist in the index)
  const tld = rows[rows.length - 1];
  const isCanonical = tld.parent_id === ROOT_NODE;

  if (!isCanonical) return null;

  return rows.map((row) => row.domain_id);
}

/**
 * Provide the canonical parents for an ENSv2 Domain.
 *
 * i.e. reverse traversal of the namegraph via registry_canonical_domains
 */
export async function getV2CanonicalPath(domainId: ENSv2DomainId): Promise<CanonicalPath | null> {
  const result = await db.execute(sql`
    WITH RECURSIVE upward AS (
      -- Base case: start from the target domain
      SELECT
        d.id AS domain_id,
        d.registry_id,
        d.label_hash,
        1 AS depth
      FROM ${schema.v2Domain} d
      WHERE d.id = ${domainId}

      UNION ALL

      -- Step upward: domain -> registry -> canonical parent domain
      SELECT
        pd.id AS domain_id,
        pd.registry_id,
        pd.label_hash,
        upward.depth + 1
      FROM upward
      JOIN ${schema.registryCanonicalDomain} rcd
        ON rcd.registry_id = upward.registry_id
      JOIN ${schema.v2Domain} pd
        ON pd.id = rcd.domain_id AND pd.subregistry_id = upward.registry_id
      WHERE upward.registry_id != ${ENSv2_ROOT_REGISTRY_ID}
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
  const isCanonical = tld.registry_id === ENSv2_ROOT_REGISTRY_ID;

  if (!isCanonical) return null;

  return rows.map((row) => row.domain_id);
}
