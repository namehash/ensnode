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
import { makeLogger } from "@/lib/logger";

const ROOT_REGISTRY_ID = getENSv2RootRegistryId(config.namespace);

const logger = makeLogger("get-domain-by-interpreted-name");
const v1Logger = makeLogger("get-domain-by-interpreted-name:v1");
const v2Logger = makeLogger("get-domain-by-interpreted-name:v2");

/**
 * Domain lookup by Interpreted Name via forward traversal of the namegraph.
 *
 * This mirrors ENS Forward Resolution (walking from the root registry through each label in the name)
 * with the exception that, in ENSv2, expired names are still retrievable: this traversal does _not_
 * check registration expiry, so callers can query Domains even after they are expired.
 *
 * For context, in ENSv1, expired names are still resolvable.
 * In ENSv2, the default PermissionedRegistry (and UserRegistry) implement the logic 'if name is
 * expired, it doesn't exist', which means expired names would not be resolvable via Forward Resolution.
 * This choice, however, is made at the Registry level, not within Forward Resolution, so other
 * Registry implementations could choose to do things differently.
 *
 * @see https://github.com/ensdomains/contracts-v2/blob/8a5bb130bc25adf68541d55e4a9a9bf453fb37fc/contracts/src/registry/PermissionedRegistry.sol#L217-L220
 * @see https://github.com/ensdomains/contracts-v2/blob/8a5bb130bc25adf68541d55e4a9a9bf453fb37fc/contracts/src/registry/PermissionedRegistry.sol#L223-L226
 *
 * Regardless, this function does not consider a Domain's registration status for retrieval because
 * this traversal is designed to support access to a Domain via API—not Protocol Acceleration—and
 * consumers need to reference Domains regardless of whether they're active or expired.
 *
 * This means that a Domain identified by this function may not be accessible by ENS Forward Resolution:
 * an expired Domain in a PermissionedRegistry/UserRegistry does not exist in the context of
 * Forward Resolution.
 *
 * Note that if a Domain has been migrated from ENSv1 to ENSv2, the ENSv2 Domain entity is returned,
 * mirroring ENS Forward Resolution.
 *
 * Finally, this also means that Domains are addressable by any number of (possibly infinite) Aliases.
 * i.e. if a name 'alias.eth' declares that the registry containing 'sub' is its subregistry but
 * that subregistry declares a different Canonical Domain, we are still able to access the 'sub' Domain
 * via 'sub.alias.eth'. Naturally, 'sub's Canonical Name will continue to be 'sub.canonical.eth',
 * not the alias by which it was queried ('sub.alias.eth').
 */
export async function getDomainIdByInterpretedName(
  name: InterpretedName,
): Promise<DomainId | null> {
  // Domains addressable in v2 are preferred, but v1 lookups are cheap, so just do them both ahead of time
  const [v1DomainId, v2DomainId] = await Promise.all([
    v1_getDomainIdByInterpretedName(name),
    v2_getDomainIdByInterpretedName(ROOT_REGISTRY_ID, name),
  ]);

  logger.debug({ v1DomainId, v2DomainId });

  // prefer v2Domain over v1Domain
  return v2DomainId || v1DomainId || null;
}

/**
 * Retrieves the ENSv1DomainId for the provided `name`, if exists.
 */
async function v1_getDomainIdByInterpretedName(name: InterpretedName): Promise<DomainId | null> {
  const node = namehash(name);
  const domainId = makeENSv1DomainId(node);

  const domain = await db.query.v1Domain.findFirst({ where: (t, { eq }) => eq(t.id, domainId) });
  const exists = domain !== undefined;

  v1Logger.debug({ node, exists });

  return exists ? domainId : null;
}

/**
 * Forward-traverses the ENSv2 namegraph from the specified root in order to identify the Domain
 * addressed by `name`.
 */
async function v2_getDomainIdByInterpretedName(
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
  if (rows.length === 0) {
    v2Logger.debug({ labelHashPath, rows });
    return null;
  }

  // biome-ignore lint/style/noNonNullAssertion: length check above
  const leaf = rows[rows.length - 1]!;

  // the v2Domain was found iff there is an exact match within the ENSv2 namegraph
  const exact = rows.length === labelHashPath.length;

  v2Logger.debug({ labelHashPath, rows, exact });

  if (exact) return leaf.domain_id;

  // otherwise, the v2 domain was not found
  return null;
}
