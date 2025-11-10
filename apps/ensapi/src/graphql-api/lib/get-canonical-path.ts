import { sql } from "drizzle-orm";

import * as schema from "@ensnode/ensnode-schema";
import type { CanonicalPath, DomainId, RegistryId } from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";
import { ROOT_REGISTRY_ID } from "@/lib/root-registry";

const MAX_DEPTH = 16;

/**
 * Provide the canonical parents from the Root Registry to `domainId`.
 * i.e. reverse traversal of the namegraph
 *
 * TODO: this implementation is more or less first-write-wins, need to updated based on proposed reverse mapping
 */
export async function getCanonicalPath(domainId: DomainId): Promise<CanonicalPath | null> {
  const result = await db.execute(sql`
    WITH RECURSIVE upward AS (
      -- Base case: start from the target domain
      SELECT
        d.id AS domain_id,
        d.registry_id,
        d.label_hash,
        1 AS depth
      FROM ${schema.domain} d
      WHERE d.id = ${domainId}

      UNION ALL

      -- Step upward: domain -> registry -> parent domain
      SELECT
        pd.id AS domain_id,
        pd.registry_id,
        pd.label_hash,
        upward.depth + 1
      FROM upward
      JOIN ${schema.registry} r
        ON r.id = upward.registry_id
      JOIN ${schema.domain} pd
        ON pd.subregistry_id = r.id
      WHERE r.id != ${ROOT_REGISTRY_ID}
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
  const isCanonical = tld.registry_id === ROOT_REGISTRY_ID;

  if (!isCanonical) return null;

  return rows.map((row) => row.domain_id);
}
