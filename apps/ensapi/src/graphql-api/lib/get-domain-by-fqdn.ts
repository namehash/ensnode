import config from "@/config";

import { Param, sql } from "drizzle-orm";
import { namehash } from "viem";

import * as schema from "@ensnode/ensnode-schema";
import {
  type DomainId,
  type ENSv1DomainId,
  type ENSv2DomainId,
  getRootRegistryId,
  type InterpretedName,
  interpretedNameToLabelHashPath,
  type LabelHash,
  makeENSv1DomainId,
  type RegistryId,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

const ROOT_REGISTRY_ID = getRootRegistryId(config.namespace);

/**
 * Gets the DomainId of the Domain addressed by `name`.
 */
export async function getDomainIdByInterpretedName(
  name: InterpretedName,
): Promise<DomainId | null> {
  const [v1DomainId, v2DomainId] = await Promise.all([
    getENSv1DomainIdByFqdn(name),
    getENSv2DomainIdByFqdn(name),
  ]);

  // prefer v2DomainId
  return v2DomainId || v1DomainId || null;
}

/**
 * Forward-traverses the ENSv2 namegraph in order to identify the Domain addressed by `name`.
 */
async function getENSv2DomainIdByFqdn(name: InterpretedName): Promise<ENSv2DomainId | null> {
  const labelHashPath = interpretedNameToLabelHashPath(name);

  // https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
  const rawLabelHashPathArray = sql`${new Param(labelHashPath)}::text[]`;

  // TODO: need to join latest registration and confirm that it's not expired, otherwise should treat the domain as not existing

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
      JOIN ${schema.v2Domain} d
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
    domain_id: ENSv2DomainId;
    label_hash: LabelHash;
    depth: number;
  }[];

  const exists = rows.length > 0 && rows.length === labelHashPath.length;
  if (!exists) return null;

  // biome-ignore lint/style/noNonNullAssertion: length check above
  const leaf = rows[rows.length - 1]!;

  return leaf.domain_id;
}

/**
 * Retrieves the ENSv1DomainId for the provided `name`, if exists.
 */
async function getENSv1DomainIdByFqdn(name: InterpretedName): Promise<ENSv1DomainId | null> {
  const node = namehash(name);
  const domainId = makeENSv1DomainId(node);

  const domain = await db.query.v1Domain.findFirst({
    where: (t, { eq }) => eq(t.id, domainId),
  });

  return domain?.id ?? null;
}
