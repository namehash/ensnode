import { trace } from "@opentelemetry/api";
import {
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
  maybeGetENSv2RootRegistryId,
} from "@ensnode/ensnode-sdk";
import { isBridgedResolver } from "@ensnode/ensnode-sdk/internal";

import di from "@/di";
import { withActiveSpanAsync } from "@/lib/instrumentation/auto-span";
import {
  forwardWalkDisjointNamegraph,
  type WalkResultRow,
  walkResultRowHasResolver,
} from "@/lib/protocol-acceleration/forward-walk-disjoint-namegraph";
import { MAX_SUPPORTED_NAME_DEPTH } from "@/omnigraph-api/lib/constants";

const tracer = trace.getTracer("get-domain-by-interpreted-name");

/**
 * The maximum number of times to hop between disjoint namegraphs, as a defense against infinite loops.
 * i.e. how many times to follow a Bridged Resolver or fall back from ENSv2 to ENSv1 or vice versa.
 */
const MAX_HOP_DEPTH = 3;

/**
 * The result of walking the namegraph for a Name: the terminal disjoint namegraph's path (after all
 * Bridged Resolver / ENSv1Resolver / ENSv2Resolver hops resolve), plus whether the leaf was an
 * exact match.
 *
 * Callers interpret this:
 * - `exact` → the Name maps to an indexed leaf Domain (`rows[0].domainId`).
 * - not `exact`, but the deepest Resolver in `rows` is an ENSIP-10 wildcard (`extended`) → the Name
 *   is resolvable-but-unindexed (an UnindexedDomain).
 * - otherwise → the Name is not resolvable (the deepest Resolver, if any, does not support ENSIP-10).
 */
export interface NamegraphWalkResult {
  /** The terminal disjoint namegraph's path rows, ordered by depth DESC (deepest first). */
  rows: WalkResultRow[];
  /** Whether the deepest row exactly matches the full `path` (i.e. the leaf Domain is indexed). */
  exact: boolean;
}

/**
 * Walks the namegraph for an Interpreted Name and returns the {@link NamegraphWalkResult}.
 *
 * Walks resolution from the primary Root Registry (ENSv2 Root when defined, otherwise the ENSv1 Root),
 * following Bridged Resolvers as necessary. When ENSv2 is defined but the initial walk does not
 * exact-match (e.g. a name registered only in ENSv1, not reserved in ENSv2), falls back to the ENSv1
 * disjoint namegraph unless an ancestor already has an ENSIP-10 wildcard Resolver. We only operate over
 * indexed data which is fully available for the ENS Root Chain.
 *
 * Unlike Forward Resolution, this walk does not check registration expiry, so callers can address
 * Domains regardless of expiry status. This means that a Domain identified by this walk may not be
 * accessible by Forward Resolution: an expired Domain in a PermissionedRegistry does not exist in
 * the context of Forward Resolution. The Domains returned by this function are Addressable but
 * not necessarily Resolvable.
 *
 * @dev depends on the Protocol Acceleration plugin which is a hard requirement for the Omnigraph API usage.
 */
export async function forwardWalkNamegraph(name: InterpretedName): Promise<NamegraphWalkResult> {
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

  return withActiveSpanAsync(tracer, "forwardWalkNamegraph", { name }, () =>
    walkNamegraphFromRegistry(getRootRegistryId(di.context.namespace), path),
  );
}

/**
 * Walks `path` from `registryId` to identify a leaf `domainId`, hopping between disjoint namegraphs
 * as necessary to implement Resolution logic (Bridged Resolver, ENSv1Resolver, ENSv2Resolver).
 *
 * This function prefers the leaf Domain within the origin Registry. i.e. if there's an ENSv2 Domain
 * like example.eth that has as its Resolver the ENSv1Resolver (which sources records from ENSv1's
 * example.eth's Resolver) this function preferentially returns the ENSv2 example.eth, which is more
 * correctly the 'resolvable' Domain; the ENSv1 example.eth is more vestigial and not the source of
 * truth.
 *
 * This same logic also encodes the preference that, for a Domain with a Bridged Resolver, the Domain
 * in the origin Registry (ex: the ENS Root Chain's 'linea.eth' [either ENSv1 or ENSv2]) we return
 * the ENS Root Chain's linea.eth instead of the Linea Chain's shadowed linea.eth (which, formally,
 * doesn't exist in the eyes of Resolution).
 */
async function walkNamegraphFromRegistry(
  registryId: RegistryId,
  path: LabelHashPath,
  depth = 0,
): Promise<NamegraphWalkResult> {
  if (depth > MAX_HOP_DEPTH) {
    throw new Error(`Invariant(walkNamegraphFromRegistry): Hop depth exceeded: ${depth}`);
  }

  // walk the disjoint namegraph by indicated by `registryId` through `path`
  const rows = await forwardWalkDisjointNamegraph(registryId, path);
  if (rows.length === 0) return { rows, exact: false };

  // rows are ORDER BY depth DESC, so deepest element is rows[0]
  const deepest = rows[0];

  // this was an exact match if the depths match the input
  const exact = deepest.depth === path.length;

  // if the exact match has a Resolver set, we can return it outright
  // NOTE: this also encodes the "prefer linea.eth on the ENS Root Chain" behavior
  if (exact && walkResultRowHasResolver(deepest)) return { rows, exact: true };

  // otherwise, identify the deepest element with a Resolver
  const deepestResolver = rows.find(walkResultRowHasResolver);
  if (deepestResolver) {
    const resolverEq = makeContractMatcher(di.context.namespace, deepestResolver);
    // Bridged Resolvers
    // if the deepest Resolver is a Bridged Resolver, recurse to the target Registry
    const bridged = isBridgedResolver(di.context.namespace, deepestResolver);
    if (bridged) {
      // to follow a Bridged Resolver, continue walking the namegraph from the target `registryId`
      // with the remaining portion of `path`

      // NOTE: we blindly return after bridging, which correctly implements the Forward Resolution
      // behavior in that the origin Domain, even if there is one, is invisible to resolution
      // (due to the ancestor Bridged Resolver) and therefore not addressable
      return walkNamegraphFromRegistry(
        bridged.targetRegistryId,
        path.slice(deepestResolver.depth),
        depth + 1,
      );
    }

    // ENSv1Resolver (ENSv1 Fallback)
    // if the deepest Resolver is the ENSv1Resolver, fallback to ENSv1
    if (resolverEq(DatasourceNames.ENSv2Root, "ENSv1Resolver")) {
      // to implement the ENSv1Resolver, walk the ENSv1 disjoint namegraph with the full path
      return walkNamegraphFromRegistry(
        getENSv1RootRegistryId(di.context.namespace),
        path,
        depth + 1,
      );
    }

    // ENSv2Resolver (ENSv2 Fallback)
    if (resolverEq(DatasourceNames.ENSv2Root, "ENSv2Resolver")) {
      // to implement the ENSv2Resolver, walk the ENSv2 disjoint namegraph with the full path
      return walkNamegraphFromRegistry(
        getENSv2RootRegistryId(di.context.namespace),
        path,
        depth + 1,
      );
    }
  }

  // ENSv1-only fallback: when the preferred ENSv2 Root walk does not exact-match and no ENSv1Resolver
  // hop applied (e.g. a .eth 2LD registered only in ENSv1, not reserved in ENSv2), walk the ENSv1
  // disjoint namegraph. Skip when an ancestor already has an ENSIP-10 wildcard Resolver — resolution
  // stays in the ENSv2 path (UnindexedDomain), not vestigial ENSv1 state.
  const ensv2RootId = maybeGetENSv2RootRegistryId(di.context.namespace);
  const triedOnlyENSv2Registry = ensv2RootId && registryId === ensv2RootId;
  const deepestResolverIsExtended = deepestResolver?.extended ?? false;
  const firstHop = depth === 0;
  if (!exact && triedOnlyENSv2Registry && firstHop && !deepestResolverIsExtended) {
    const v1Result = await walkNamegraphFromRegistry(
      getENSv1RootRegistryId(di.context.namespace),
      path,
      depth + 1,
    );
    if (v1Result.exact) return v1Result;
  }

  // finally, return the terminal path; the caller interprets `exact` (indexed leaf) vs a deepest
  // wildcard Resolver (resolvable-but-unindexed) vs neither (not resolvable)
  return { rows, exact };
}
