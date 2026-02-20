import config from "@/config";

import { Param, sql } from "drizzle-orm";
import { namehash } from "viem";

import * as schema from "@ensnode/ensnode-schema";
import {
  type DomainId,
  type ENSv2DomainId,
  getENSv2RootRegistryId,
  type InterpretedName,
  interpretedLabelsToLabelHashPath,
  interpretedNameToInterpretedLabels,
  type LabelHash,
  makeENSv1DomainId,
  type RegistryId,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

const ROOT_REGISTRY_ID = getENSv2RootRegistryId(config.namespace);

/**
 * Gets the DomainId of the Domain addressed by `name`.
 */
export async function getDomainIdByInterpretedName(
  name: InterpretedName,
): Promise<DomainId | null> {
  // Domains addressable in v2 are preferred, but v1 lookups are cheap, so just do them both ahead of time
  const [v1DomainId, v2DomainId] = await Promise.all([
    v1_getDomainIdByFqdn(name),
    v2_getDomainIdByFqdn(ROOT_REGISTRY_ID, name),
  ]);

  // prefer v2DomainId if exists
  return v2DomainId || v1DomainId || null;
}

/**
 * Retrieves the ENSv1DomainId for the provided `name`, if exists.
 */
async function v1_getDomainIdByFqdn(name: InterpretedName): Promise<DomainId | null> {
  const node = namehash(name);
  const domainId = makeENSv1DomainId(node);

  const domain = await db.query.v1Domain.findFirst({ where: (t, { eq }) => eq(t.id, domainId) });
  return domain?.id ?? null;
}

/**
 * Forward-traverses the ENSv2 namegraph from the specified root in order to identify the Domain
 * addressed by `name`.
 */
async function v2_getDomainIdByFqdn(
  rootRegistryId: RegistryId,
  name: InterpretedName,
): Promise<DomainId | null> {
  const labelHashPath = interpretedLabelsToLabelHashPath(interpretedNameToInterpretedLabels(name));

  // https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
  const rawLabelHashPathArray = sql`${new Param(labelHashPath)}::text[]`;

  // TODO: need to join latest registration and confirm that it's not expired, if expired should treat the domain as not existing

  const result = await db.execute(sql`
    WITH RECURSIVE path AS (
      SELECT
        r.id AS registry_id,
        NULL::text AS domain_id,
        NULL::text AS label_hash,
        0 AS depth
      FROM ${schema.registry} r
      WHERE r.id = ${rootRegistryId}

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

  // couldn't for the life of me figure out how to type this result this correctly within drizzle...
  const rows = result.rows as {
    registry_id: RegistryId;
    domain_id: ENSv2DomainId;
    label_hash: LabelHash;
    depth: number;
  }[];

  // this was a query for a TLD and it does not exist within the ENSv2 namegraph
  if (rows.length === 0) return null;

  // biome-ignore lint/style/noNonNullAssertion: length check above
  const leaf = rows[rows.length - 1]!;

  // the v2Domain was found iff there is an exact match within the ENSv2 namegraph
  const exact = rows.length === labelHashPath.length;
  if (exact) return leaf.domain_id;

  // otherwise, the v2 domain was not found
  return null;
}
