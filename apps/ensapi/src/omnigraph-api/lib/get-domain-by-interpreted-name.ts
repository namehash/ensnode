import config from "@/config";

import { trace } from "@opentelemetry/api";
import { Param, sql } from "drizzle-orm";
import {
  type Address,
  type ChainId,
  type DomainId,
  ENS_ROOT_NAME,
  type InterpretedName,
  interpretedLabelsToLabelHashPath,
  interpretedNameToInterpretedLabels,
  type LabelHashPath,
  type RegistryId,
} from "enssdk";

import { DatasourceNames } from "@ensnode/datasources";
import {
  getENSv1RootRegistryId,
  getENSv2RootRegistryId,
  getRootRegistryId,
  makeContractMatcher,
  type RequiredAndNotNull,
} from "@ensnode/ensnode-sdk";
import { isBridgedResolver } from "@ensnode/ensnode-sdk/internal";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { withActiveSpanAsync } from "@/lib/instrumentation/auto-span";
import { MAX_SUPPORTED_NAME_DEPTH } from "@/omnigraph-api/lib/constants";

const tracer = trace.getTracer("get-domain-by-interpreted-name");

/**
 * The maximum number of times to hop between disjoint namegraphs, as a defense against infinite loops.
 * i.e. how many times to follow a Bridged Resolver or fall back from ENSv2 to ENSv1 or vise-versa.
 */
const MAX_HOP_DEPTH = 3;

interface WalkResultRow {
  domainId: DomainId;
  depth: number;
  address: Address | null;
  chainId: ChainId | null;
}

/**
 * Determines whether the WalkResultRow has a resolver set.
 */
const hasResolver = (
  row: WalkResultRow,
): row is RequiredAndNotNull<WalkResultRow, "address" | "chainId"> =>
  row.address !== null && row.chainId !== null;

/**
 * Domain lookup by Interpreted Name by traversing the namegraph.
 *
 * Walks resolution from the primary Root Registry (ENSv2 Root when defined, otherwise the ENSv1
 * concrete Root), following Bridged Resolvers as necessary, returning the leaf Domain upon an exact
 * match. We only operate over indexed data with acceleration implicitly enabled; if the traversal
 * of the namegraph cannot be accelerated, this function won't be able to identify the Domain
 * indicated by `name`.
 *
 * Unlike Forward Resolution, this function does not check registration expiry, so callers can
 * address Domains regardless of expiry status. This means that a Domain identified by this function
 * may not be accessible by Forward Resolution: an expired Domain in a PermissionedRegistry does not
 * exist in the context of Forward Resolution.
 *
 * @dev depends on the Protocol Acceleration plugin which is a hard requirement for ensv2/omnigraph usage
 */
export async function getDomainIdByInterpretedName(
  name: InterpretedName,
): Promise<DomainId | null> {
  if (name === ENS_ROOT_NAME) {
    throw new Error(`Invariant: the ENS Root Name ('') is not addressable.`);
  }

  const path = interpretedLabelsToLabelHashPath(interpretedNameToInterpretedLabels(name));
  if (path.length === 0) {
    throw new Error(`Invariant: ${name} generated 0 labelHashPath segments.`);
  }

  if (path.length > MAX_SUPPORTED_NAME_DEPTH) {
    throw new Error(`Invariant: Name '${name}' exceeds maximum depth ${MAX_SUPPORTED_NAME_DEPTH}.`);
  }

  return withActiveSpanAsync(tracer, "getDomainIdByInterpretedName", { name }, () =>
    forwardWalkNamegraph(getRootRegistryId(config.namespace), path),
  );
}

/**
 * Walks `path` from `registryId` to identify a leaf `domainId`, hopping between disjoint namegraphs
 * as necessary to implement Resolution logic (Bridged Resolver, ENSv1Resolver, ENSv2Resolver).
 *
 * This function prefers the leaf Domain within the origin Registry. i.e. if there's an ENSv2 Domain
 * like example.eth that has as its Resolver the ENSv1Resolver (which sources records from ENSv1's
 * example.eth's Resolver) this function preferentially returns the ENSv2 example.eth, which is more
 * correctly the 'resolvable' Domain; the ENSv1 example.eth is more vestigal and not the source of
 * truth.
 *
 * This same logic also encodes the preference that, for a Domain with a Bridged Resolver, the Domain
 * in the origin Registry (ex: the ENS Root Chain's 'linea.eth' [either ENSv1 or ENSv2]) we return
 * the ENS Root Chain's linea.eth instead of the Linea Chain's shadowed linea.eth (which, formally,
 * doesn't exist in the eyes of Resolution).
 */
async function forwardWalkNamegraph(
  registryId: RegistryId,
  path: LabelHashPath,
  depth = 0,
): Promise<DomainId | null> {
  if (depth > MAX_HOP_DEPTH) {
    throw new Error(`Invariant(forwardWalkNamegraph): Hop depth exceeded: ${depth}`);
  }

  // walk the disjoint namegraph by indicated by `registryId` through `path`
  const rows = await forwardWalkDisjointNamegraph(registryId, path);
  if (rows.length === 0) return null;

  // rows are ORDER BY depth DESC, so deepest element is rows[0]
  const deepest = rows[0];

  // this was an exact match if the depths match the input
  const exact = deepest.depth === path.length;

  // if the exact match has a Resolver set, we can return it outright
  // NOTE: this also encodes the "prefer linea.eth on the ENS Root Chain" behavior
  if (exact && hasResolver(deepest)) return deepest.domainId;

  // otherwise, identify the deepest element with a Resolver
  const deepestResolver = rows.find(hasResolver);
  if (deepestResolver) {
    const resolverEq = makeContractMatcher(config.namespace, deepestResolver);
    // Bridged Resolvers
    // if the deepest Resolver is a Bridged Resolver, recurse to the target Registry
    const bridged = isBridgedResolver(config.namespace, deepestResolver);
    if (bridged) {
      // to follow a Bridged Resolver, continue walking the namegraph from the target `registryId`
      // with the remaining portion of `path`

      // NOTE: we blindly return after bridging, which correctly implements the Forward Resolution
      // behavior in that the origin Domain, even if there is one, is invisible to resolution
      // (due to the ancestor Bridged Resolver) and therefore not addressable
      return forwardWalkNamegraph(bridged.registryId, path.slice(deepestResolver.depth), depth + 1);
    }

    // ENSv1Resolver (ENSv1 Fallback)
    // if the deepest Resolver is the ENSv1Resolver, fallback to ENSv1
    if (resolverEq(DatasourceNames.ENSv2Root, "ENSv1Resolver")) {
      // to implement the ENSv1Resolver, walk the ENSv1 disjoint namegraph with the full path
      return forwardWalkNamegraph(getENSv1RootRegistryId(config.namespace), path, depth + 1);
    }

    // ENSv1Resolver (ENSv2 Fallback)
    if (resolverEq(DatasourceNames.ENSv2Root, "ENSv2Resolver")) {
      // to implement the ENSv2Resolver, walk the ENSv2 disjoint namegraph with the full path
      return forwardWalkNamegraph(getENSv2RootRegistryId(config.namespace), path, depth + 1);
    }
  }

  // finally, return the exact match if it was the leaf
  return exact ? deepest.domainId : null;
}

/**
 * Walks a disjoint namegraph from `registryId` through `path` to identify each ancestor Domain,
 * then LEFT JOINs each Domain to its Resolver via DRR and returns the full path ordered by depth
 * DESC (deepest first). Resolver-less Domains are kept in the result with `resolver`/`chainId` set
 * to NULL. Recursion terminates when the path is exhausted.
 */
async function forwardWalkDisjointNamegraph(registryId: RegistryId, path: LabelHashPath) {
  if (path.length === 0) return [];

  // NOTE: using new Param as per https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
  const rawLabelHashPathArray = sql`${new Param(path)}::text[]`;

  const result = await ensDb.execute(sql`
    WITH RECURSIVE path AS (
      SELECT
        ${registryId}::text         AS next_registry_id,
        NULL::text                  AS "domainId",
        0                           AS depth

      UNION ALL

      SELECT
        -- NOTE: that here we recurse by domain.subregistry_id (the on-chain forward pointer)
        -- NOT domain_canonical_subregistries.canonical_subregistry_id. This walk addresses
        -- non-canonical Domains too, so it must follow the raw subregistry edge.
        d.subregistry_id            AS next_registry_id,
        d.id                        AS "domainId",
        path.depth + 1
      FROM path
      JOIN ${ensIndexerSchema.domain} d
        ON d.registry_id = path.next_registry_id
      WHERE d.label_hash = (${rawLabelHashPathArray})[path.depth + 1]
        AND path.depth + 1 <= array_length(${rawLabelHashPathArray}, 1)
        AND path.depth < ${MAX_SUPPORTED_NAME_DEPTH}
    )
    SELECT
      path."domainId",
      drr.resolver  AS "address",
      drr.chain_id  AS "chainId",
      path.depth
    FROM path
    LEFT JOIN ${ensIndexerSchema.domainResolverRelation} drr
      ON drr.domain_id = path."domainId"
    WHERE path."domainId" IS NOT NULL
    ORDER BY path.depth DESC;
  `);

  return result.rows as unknown as WalkResultRow[];
}
