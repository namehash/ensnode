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
  accountIdEqual,
  getENSv1RootRegistryId,
  getRootRegistryId,
  maybeGetDatasourceContract,
  type RequiredAndNotNull,
} from "@ensnode/ensnode-sdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { withActiveSpanAsync } from "@/lib/instrumentation/auto-span";

const tracer = trace.getTracer("get-domain-by-interpreted-name");

/**
 * The maximum number of times to hop between disjoint namegraphs, as a defense against infinite loops.
 * i.e. how many times to follow a Bridged Resolver or fall back from ENSv2 to ENSv1 or vise-versa.
 */
const MAX_HOP_DEPTH = 3;

/**
 * The maximum depth to walk the namegraph from any Registry.
 */
const MAX_WALK_DEPTH = 16;

interface WalkResultRow {
  domainId: DomainId;
  address: Address | null;
  chainId: ChainId | null;
  depth: number;
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

  if (path.length > MAX_WALK_DEPTH) {
    throw new Error(`Invariant: Name '${name}' exceeds maximum depth ${MAX_WALK_DEPTH}.`);
  }

  return withActiveSpanAsync(tracer, "getDomainIdByInterpretedName", { name }, () =>
    resolveCanonicalDomainId(getRootRegistryId(config.namespace), path),
  );
}

/**
 * Bridged Resolver attachments are wired into the canonical namegraph at index time (the bridged
 * (shadow)Registry becomes the originating Domain's `canonicalSubregistryId`), so the walk follows
 * them as ordinary canonical edges without a path-slice. The remaining hop logic preserves the
 * ENSv1 fallback for ENSv1Resolver.
 *
 * For Domains with Bridged Resolvers the origin Domain is the correct result — i.e. "linea.eth"
 * resolves to the ENS Root Chain's "linea.eth", not the Linea Chain's shadowed linea.eth. Not only
 * do users want the origin chain's entry the existence of the shadowed linea.eth is an implementation
 * detail of Shadow Registries, and not relevant for traversal/resolution.
 */
async function resolveCanonicalDomainId(
  registryId: RegistryId,
  path: LabelHashPath,
  depth = 0,
): Promise<DomainId | null> {
  if (depth > MAX_HOP_DEPTH) {
    throw new Error(
      `Invariant(resolveCanonicalDomainId): Bridged Resolver depth exceeded: ${depth}`,
    );
  }

  const rows = await walkCanonicalNamegraph(registryId, path);
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
    // ENSv1Resolver (ENSv1 Fallback)
    // if the deepest Resolver is the ENSv1Resolver, fallback to ENSv1
    const ENSv1Resolver = maybeGetDatasourceContract(
      config.namespace,
      DatasourceNames.ENSv2Root,
      "ENSv1Resolver",
    );
    if (ENSv1Resolver && accountIdEqual(deepestResolver, ENSv1Resolver)) {
      // fallback to ENSv1 using the full path
      return resolveCanonicalDomainId(getENSv1RootRegistryId(config.namespace), path, depth + 1);
    }

    // TODO: ENSv2Resolver
  }

  // finally, return the exact match if it was the leaf
  return exact ? deepest.domainId : null;
}

/**
 * Walks the Canonical namegraph from `registryId` through `path` to identify each ancestor Domain,
 * then LEFT JOINs each Domain to its Resolver via DRR and returns the full path ordered by depth
 * DESC (deepest first). Resolver-less Domains are kept in the result with `resolver`/`chainId` set
 * to NULL. Recursion terminates when the path is exhausted, when a Domain is non-canonical, or
 * when `canonical_subregistry_id` becomes NULL (leaf canonical domain).
 */
async function walkCanonicalNamegraph(registryId: RegistryId, path: LabelHashPath) {
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
        d.canonical_subregistry_id  AS next_registry_id,
        d.id                        AS "domainId",
        path.depth + 1
      FROM path
      JOIN ${ensIndexerSchema.domain} d
        ON d.registry_id = path.next_registry_id
      WHERE d.label_hash = (${rawLabelHashPathArray})[path.depth + 1]
        AND d.canonical = TRUE
        AND path.depth + 1 <= array_length(${rawLabelHashPathArray}, 1)
        AND path.depth < ${MAX_WALK_DEPTH}
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
