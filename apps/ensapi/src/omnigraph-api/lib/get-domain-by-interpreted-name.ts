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
  makeConcreteRegistryId,
  type RegistryId,
} from "enssdk";

import { getRootRegistryId, type RequiredAndNotNull } from "@ensnode/ensnode-sdk";
import { isBridgedResolver } from "@ensnode/ensnode-sdk/internal";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { withActiveSpanAsync } from "@/lib/instrumentation/auto-span";

const tracer = trace.getTracer("get-domain-by-interpreted-name");

/**
 * The maximum number of times to follow a Bridged Resolver, as a defense against infinite loops.
 */
const MAX_BRIDGE_DEPTH = 2;

/**
 * The maximum depth to walk the namegraph from any Registry.
 */
const MAX_WALK_DEPTH = 16;

interface WalkResultRow {
  domainId: DomainId;
  resolver: Address | null;
  chainId: ChainId | null;
  depth: number;
}

/**
 * Determines whether the WalkResultRow has a resolver set.
 */
const hasResolver = (
  row: WalkResultRow,
): row is RequiredAndNotNull<WalkResultRow, "resolver" | "chainId"> =>
  row.resolver !== null && row.chainId !== null;

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
 * Recursively walks the namegraph from `registryId` through `path`, joining each Domain with its
 * Resolver via Domain-Resolver Relations. If there's an exact match, we return the identified domain,
 * otherwise if the deepest defined resolver is a Bridged Resolver, we recurse to
 * that target's Registry and continue walking, otherwise we were unable to identify the Domain.
 *
 * For ENSv1 Shadow Registries the bridged Registry's namegraph shadows that of the Root Chain's,
 * meaning that it is represented as (shadow)RootRegistry -> "eth" -> ENSv1VirtualRegistry for eth
 * -> "linea" ... etc. So when we recurse into a Shadow Registry we must pass the full `path`.
 *
 * In contrast, all ENSv2 Registries are rooted at the name being Bridged (they're relative to their
 * parent); when recusing we must walk from the _remaining_ segments of `path`.
 *
 * Note that for Domains with Bridged Resolvers, we prefer the origin Domain, not the Domain within
 * the target (shadow) Registry; in practice this means when someone asks for "linea.eth" they'll get
 * the ENS Root Chain's "linea.eth", NOT the Linea Chain's "linea.eth" in the Linea Shadow Registry.
 * This makes sense because:
 *  a) users probably want the ENS Root Chain's "linea.eth" regardless, and
 *  b) in non-shadow Registries, there's no "linea.eth" to address.
 */
async function resolveCanonicalDomainId(
  registryId: RegistryId,
  path: LabelHashPath,
  depth = 0,
): Promise<DomainId | null> {
  // Sanity Check: maximum recursion depth of 2. technically only 1 is necessary because we only
  // have well-known Bridged Resolvers that bridge from the Root chain to an L2 chain, without
  // further hops.
  if (depth > MAX_BRIDGE_DEPTH) {
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
    const bridgesTo = isBridgedResolver(config.namespace, {
      chainId: deepestResolver.chainId,
      address: deepestResolver.resolver,
    });

    // if the deepest Resolver is a Bridged Resolver, recurse to the target Registry
    if (bridgesTo) {
      // slice the path according to whether target Registry is a Shadow Registry or not
      const targetPath = bridgesTo.shadow ? path : path.slice(deepestResolver.depth);

      // Bridged Resolvers only bridge to a Concrete Registry contract, an ENSv1Registry or an
      // ENSv2Registry, so we can safely construct its id here
      const targetRegistryId = makeConcreteRegistryId(bridgesTo.registry);

      // then recurse
      // NOTE: we blindly return after bridging, which correctly implements the Forward Resolution
      // behavior which is that the origin Domain, even if there is one, is invisible to resolution
      // (due to the ancestor Bridged Resolver) and therefore not Canonical
      return resolveCanonicalDomainId(targetRegistryId, targetPath, depth + 1);
    }
  }

  // finally, return the exact match if it was the leaf
  return exact ? deepest.domainId : null;
}

/**
 * Walks the Canonical namegraph from `registryId` through `path` to identify each ancestor Domain,
 * then LEFT JOINs each Domain to its Resolver via DRR and returns the full path ordered by depth
 * DESC (deepest first). Resolver-less Domains are kept in the result with `resolver`/`chainId` set
 * to NULL. Recursion terminates when the path is exhausted or `subregistry_id` becomes NULL (leaf
 * domain).
 */
async function walkCanonicalNamegraph(registryId: RegistryId, path: LabelHashPath) {
  if (path.length === 0) return [];

  // NOTE: using new Param as per https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
  const rawLabelHashPathArray = sql`${new Param(path)}::text[]`;

  const result = await ensDb.execute(sql`
    WITH RECURSIVE path AS (
      SELECT
        ${registryId}::text AS next_registry_id,
        NULL::text          AS "domainId",
        0                   AS depth

      UNION ALL

      SELECT
        d.subregistry_id   AS next_registry_id,
        d.id               AS "domainId",
        path.depth + 1
      FROM path
      JOIN ${ensIndexerSchema.domain} d
        ON d.registry_id = path.next_registry_id
      WHERE d.label_hash = (${rawLabelHashPathArray})[path.depth + 1]
        AND path.depth + 1 <= array_length(${rawLabelHashPathArray}, 1)
        AND path.depth < ${MAX_WALK_DEPTH}
    )
    SELECT
      path."domainId",
      drr.resolver,
      drr.chain_id AS "chainId",
      path.depth
    FROM path
    LEFT JOIN ${ensIndexerSchema.domainResolverRelation} drr
      ON drr.domain_id = path."domainId"
    WHERE path."domainId" IS NOT NULL
    ORDER BY path.depth DESC;
  `);

  return result.rows as unknown as WalkResultRow[];
}
