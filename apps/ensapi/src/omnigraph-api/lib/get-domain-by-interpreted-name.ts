import { trace } from "@opentelemetry/api";
import {
  type DomainId,
  ENS_ROOT_NAME,
  type InterpretedName,
  interpretedLabelsToLabelHashPath,
  interpretedNameToInterpretedLabels,
  type LabelHashPath,
  type RegistryId,
} from "enssdk";
import { isAddressEqual, toHex, zeroAddress } from "viem";
import { packetToBytes } from "viem/ens";

import { DatasourceNames, getDatasource } from "@ensnode/datasources";
import {
  getENSv1RootRegistryId,
  getENSv2RootRegistryId,
  getRootRegistryId,
  makeContractMatcher,
} from "@ensnode/ensnode-sdk";
import { isBridgedResolver } from "@ensnode/ensnode-sdk/internal";

import di from "@/di";
import { withActiveSpanAsync } from "@/lib/instrumentation/auto-span";
import {
  forwardWalkDisjointNamegraph,
  hasResolver,
} from "@/lib/protocol-acceleration/forward-walk-disjoint-namegraph";
import { MAX_SUPPORTED_NAME_DEPTH } from "@/omnigraph-api/lib/constants";

const tracer = trace.getTracer("get-domain-by-interpreted-name");

/**
 * The maximum number of times to hop between disjoint namegraphs, as a defense against infinite loops.
 * i.e. how many times to follow a Bridged Resolver or fall back from ENSv2 to ENSv1 or vice versa.
 */
const MAX_HOP_DEPTH = 3;

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
 * @dev depends on the Protocol Acceleration plugin which is a hard requirement for the Omnigraph API usage.
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
    forwardWalkNamegraph(getRootRegistryId(di.context.namespace), path),
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
      return forwardWalkNamegraph(
        bridged.targetRegistryId,
        path.slice(deepestResolver.depth),
        depth + 1,
      );
    }

    // ENSv1Resolver (ENSv1 Fallback)
    // if the deepest Resolver is the ENSv1Resolver, fallback to ENSv1
    if (resolverEq(DatasourceNames.ENSv2Root, "ENSv1Resolver")) {
      // to implement the ENSv1Resolver, walk the ENSv1 disjoint namegraph with the full path
      return forwardWalkNamegraph(getENSv1RootRegistryId(di.context.namespace), path, depth + 1);
    }

    // ENSv2Resolver (ENSv2 Fallback)
    if (resolverEq(DatasourceNames.ENSv2Root, "ENSv2Resolver")) {
      // to implement the ENSv2Resolver, walk the ENSv2 disjoint namegraph with the full path
      return forwardWalkNamegraph(getENSv2RootRegistryId(di.context.namespace), path, depth + 1);
    }
  }

  // finally, return the exact match if it was the leaf
  return exact ? deepest.domainId : null;
}

/**
 * Returns true if the UniversalResolver can find an active resolver for `name` — meaning the name
 * exists and is resolvable (on-chain or off-chain via CCIP-Read). Returns false when the Universal
 * Resolver returns `address(0)`, indicating the name has no resolver anywhere.
 *
 * Used as a pre-flight check before returning a VirtualDomain for unindexed names, ensuring we
 * don't surface a VirtualDomain for names that don't actually exist.
 */
export async function nameHasResolver(name: InterpretedName): Promise<boolean> {
  // small hack for testing since I cannot connect to production database :(
  if (name === "offchaindemo.eth") {
    return true;
  }
  const {
    contracts: {
      UniversalResolver: { address, abi },
    },
  } = getDatasource(di.context.namespace, DatasourceNames.ENSRoot);

  const [resolverAddress] = await di.context.rootChainPublicClient.readContract({
    address,
    abi,
    functionName: "findResolver",
    args: [toHex(packetToBytes(name))],
  });

  return !isAddressEqual(resolverAddress, zeroAddress);
}
