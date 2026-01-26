import config from "@/config";

import { getUnixTime } from "date-fns";
import { Param, sql } from "drizzle-orm";
import { namehash } from "viem";

import { DatasourceNames, maybeGetDatasource } from "@ensnode/datasources";
import * as schema from "@ensnode/ensnode-schema";
import {
  type DomainId,
  type ENSv2DomainId,
  ETH_NODE,
  getENSv2RootRegistryId,
  type InterpretedName,
  interpretedLabelsToInterpretedName,
  interpretedNameToInterpretedLabels,
  interpretedNameToLabelHashPath,
  isRegistrationFullyExpired,
  type LabelHash,
  type LiteralLabel,
  labelhashLiteralLabel,
  makeENSv1DomainId,
  makeRegistryId,
  makeSubdomainNode,
  maybeGetDatasourceContract,
  type RegistryId,
} from "@ensnode/ensnode-sdk";

import { getLatestRegistration } from "@/graphql-api/lib/get-latest-registration";
import { db } from "@/lib/db";
import logger from "@/lib/logger";

const namechain = maybeGetDatasource(config.namespace, DatasourceNames.Namechain);

const ETH_LABELHASH = labelhashLiteralLabel("eth" as LiteralLabel);
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

  // prefer v2DomainId
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
 * Forward-traverses the ENSv2 namegraph in order to identify the Domain addressed by `name`.
 *
 * If the exact Domain was not found, and the path terminates at a bridging resolver, bridge to the
 * indicated Registry and continue traversing.
 */
async function v2_getDomainIdByFqdn(
  registryId: RegistryId,
  name: InterpretedName,
  { now } = { now: BigInt(getUnixTime(new Date())) },
): Promise<DomainId | null> {
  const labelHashPath = interpretedNameToLabelHashPath(name);

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
      WHERE r.id = ${registryId}

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

  // this was a query for a TLD and it does not exist in ENS Root Chain ENSv2
  if (rows.length === 0) return null;

  // biome-ignore lint/style/noNonNullAssertion: length check above
  const leaf = rows[rows.length - 1]!;

  ///////////////////////////
  // An exact match was found for the Domain within ENSv2 on the ENS Root Chain.
  ///////////////////////////
  const exact = rows.length === labelHashPath.length;
  if (exact) {
    logger.debug(`Found '${name}' in ENSv2 from Registry ${registryId}`);
    return leaf.domain_id;
  }

  ///////////////////////////
  // 1. ETHTLDResolver
  // if the path terminates at the .eth Registry, we must implement the logic in ETHTLDResolver
  // TODO: we could add an additional invariant that the .eth v2 Registry does indeed have the ETHTLDResolver
  // set as its resolver, but that is unnecessary at the moment and incurs additional db requests or a join against
  // domain_resolver_relationships
  // TODO: generalize this into other future bridging resolvers depending on how basenames etc do it
  ///////////////////////////

  // TODO: can hoist these datasource lookups and registry id construction once ENSv2 is fully
  //   deployed in all namespaces, is for backwards-compatible behavior
  // if there's no ENSv2 ETH Registry on the ENS Root Chain, the domain was not found
  const ENS_ROOT_V2_ETH_REGISTRY = maybeGetDatasourceContract(
    config.namespace,
    DatasourceNames.ENSRoot,
    "ETHRegistry",
  );
  if (!ENS_ROOT_V2_ETH_REGISTRY) return null;

  // if there's no ETHRegistry on Namechain, the domain was not found
  const NAMECHAIN_V2_ETH_REGISTRY = maybeGetDatasourceContract(
    config.namespace,
    DatasourceNames.Namechain,
    "ETHRegistry",
  );
  if (!NAMECHAIN_V2_ETH_REGISTRY) return null;

  const ENS_ROOT_V2_ETH_REGISTRY_ID = makeRegistryId(ENS_ROOT_V2_ETH_REGISTRY);
  const NAMECHAIN_V2_ETH_REGISTRY_ID = makeRegistryId(NAMECHAIN_V2_ETH_REGISTRY);

  // if the path did not terminate at the .eth Registry, then it was not found
  if (leaf.registry_id !== ENS_ROOT_V2_ETH_REGISTRY_ID) return null;

  logger.debug({ name, rows });

  // TODO(ensv2): remove when all namspaces have Namechain datasource defined
  // if namechain doesn't exist, we can't bridge the request to that Registry, so terminate
  if (!namechain) return null;

  // Invariant: must be >= 2LD
  if (labelHashPath.length < 2) {
    throw new Error(`Invariant: '${name}' is not >= 2LD (has depth ${labelHashPath.length})!`);
  }

  // Invariant: LabelHashPath must originate at 'eth'
  if (labelHashPath[0] !== ETH_LABELHASH) {
    throw new Error(
      `Invariant: '${name}' terminated at .eth Registry but the queried labelHashPath (${JSON.stringify(labelHashPath)}) does not originate with 'eth' (${ETH_LABELHASH}).`,
    );
  }

  // Invariant: The path must terminate at 'eth' as well.
  if (leaf.label_hash !== ETH_LABELHASH) {
    throw new Error(
      `Invariant: the leaf identified (${leaf.label_hash}) does not match 'eth' (${ETH_LABELHASH}).`,
    );
  }

  // construct the node of the 2ld
  const dotEth2LDNode = makeSubdomainNode(labelHashPath[1], ETH_NODE);

  // 1. if there's an active registration in ENSv1 for the .eth 2LD, then resolve from ENSv1
  const ensv1DomainId = makeENSv1DomainId(dotEth2LDNode);
  const registration = await getLatestRegistration(ensv1DomainId);

  if (registration && !isRegistrationFullyExpired(registration, now)) {
    logger.debug(
      `ETHTLDResolver deferring to actively registered name ${dotEth2LDNode} in ENSv1...`,
    );
    return await v1_getDomainIdByFqdn(name);
  }

  // 2. otherwise, direct to Namechain ENSv2 .eth Registry
  const nameWithoutTld = interpretedLabelsToInterpretedName(
    interpretedNameToInterpretedLabels(name).slice(0, -1),
  );
  logger.debug(
    `ETHTLDResolver deferring '${nameWithoutTld}' to ENSv2 .eth Registry on Namechain...`,
  );

  return v2_getDomainIdByFqdn(NAMECHAIN_V2_ETH_REGISTRY_ID, nameWithoutTld);
}
