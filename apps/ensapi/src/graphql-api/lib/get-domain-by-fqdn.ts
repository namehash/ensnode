import { Param, sql } from "drizzle-orm";

import * as schema from "@ensnode/ensnode-schema";
import {
  type DomainId,
  type InterpretedName,
  interpretedNameToLabelHashPath,
  type LabelHash,
  type RegistryId,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";
import { ROOT_REGISTRY_ID } from "@/lib/root-registry";

/**
 * Gets the Domain addressed by `name`.
 * i.e. forward traversal of the namegraph
 */
export async function getDomainIdByInterpretedName(
  name: InterpretedName,
): Promise<DomainId | null> {
  const labelHashPath = interpretedNameToLabelHashPath(name);

  // https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
  const rawLabelHashPathArray = sql`${new Param(labelHashPath)}::text[]`;

  const result = await db.execute(sql`
    WITH RECURSIVE path AS (
      SELECT
        r.id AS registry_id,
        NULL::text AS domain_id,
        NULL::text AS label_hash,
        0 AS depth
      FROM ${schema.registry} r
      WHERE r.id = ${ROOT_REGISTRY_ID}

      UNION ALL

      SELECT
        d.subregistry_id AS registry_id,
        d.id AS domain_id,
        d.label_hash,
        path.depth + 1
      FROM path
      JOIN ${schema.domain} d
        ON d.registry_id = path.registry_id
      WHERE d.label_hash = (${rawLabelHashPathArray})[path.depth + 1]
        AND path.depth + 1 <= array_length(${rawLabelHashPathArray}, 1)
    )
    SELECT *
    FROM path
    WHERE domain_id IS NOT NULL
    ORDER BY depth;
  `);

  // couldn't for the life of me figure out how to drizzle this correctly...
  const rows = result.rows as {
    registry_id: RegistryId;
    domain_id: DomainId;
    label_hash: LabelHash;
    depth: number;
  }[];

  const exists = rows.length > 0 && rows.length === labelHashPath.length;
  if (!exists) return null;

  // biome-ignore lint/style/noNonNullAssertion: length check above
  const leaf = rows[rows.length - 1]!;

  return leaf.domain_id;
}
