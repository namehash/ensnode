import { db, publicClients } from "ponder:api";
import { DatasourceNames, getDatasource, getENSRootChainId } from "@ensnode/datasources";
import { type Name, type Node, PluginName, getNameHierarchy } from "@ensnode/ensnode-sdk";
import { type Address, isAddressEqual, namehash, toHex, zeroAddress } from "viem";
import { packetToBytes } from "viem/ens";

import config from "@/config";
import { parseResolverId } from "@/lib/ids";

type FindResolverResult =
  | {
      activeName: null;
      activeResolver: null;
      requiresWildcardSupport: undefined;
    }
  | { activeName: Name; requiresWildcardSupport: boolean; activeResolver: Address };

const NULL_RESULT: FindResolverResult = {
  activeName: null,
  activeResolver: null,
  requiresWildcardSupport: undefined,
};

export async function findResolver(chainId: number, name: Name) {
  // TODO: Accelerate names that are subnames of well-known registrar managed names (i.e. base.eth, .linea.eth)
  // .base.eth -> ensroot.BasenamesL1Resolver.address;
  // .linea.eth -> ensroot.LineanamesL1Resolver.address;
  // note that with that acceleration approach we may need to explicitly not suppport or make a
  // carve-out for those base.eth subdomains on mainnet

  // Implicit Invariant: findResolver is _always_ called for the ENSRoot Chain and then _ONLY_
  // called with chains for which we are guaranteed to have the Domain-Resolver relations indexed.
  // This is enforced by the requirement that `forwardResolve` with non-ENSRoot chain ids is only
  // called when an known offchain lookup resolver defers to a plugin that is active.

  // if the Subgraph plugin is not active, then we don't have Domain-Resolver relationships
  // for the ENSRoot Chain
  if (!config.plugins.includes(PluginName.Subgraph)) {
    // use the UniversalResolver on the ENSRoot Chain
    return findResolverWithUniversalResolver(chainId, name);
  }

  // otherwise we _must_ have access to the indexed Domain-Resolver relations necessary to look up
  // the Domain's configured Resolver (see invariant above)
  return findResolverWithIndex(chainId, name);
}

/**
 * Gets the resolverAddress for the specified `name` using the UniversalResolver on the ENSRoot.
 */
async function findResolverWithUniversalResolver(
  chainId: number,
  name: Name,
): Promise<FindResolverResult> {
  // Invariant: This must be the ENS Root Chain
  if (chainId !== getENSRootChainId(config.namespace)) {
    throw new Error(
      `Invariant: findResolverWithUniversalResolver called in the context of a chainId "${chainId}" for which there is no UniversalResolver.`,
    );
  }

  const {
    contracts: {
      UniversalResolver: { address, abi },
    },
  } = getDatasource(config.namespace, DatasourceNames.ENSRoot);

  const [activeResolver, , _offset] = await publicClients[chainId]!.readContract({
    address,
    abi,
    functionName: "findResolver",
    args: [toHex(packetToBytes(name))],
  });

  if (isAddressEqual(activeResolver, zeroAddress)) return NULL_RESULT;

  // will never occur, exclusively for the type checking...
  if (_offset > Number.MAX_SAFE_INTEGER) {
    throw new Error(
      `Invariant: UniversalResolver returned an offset (${_offset}) larger than MAX_SAFE_INTEGER.`,
    );
  }
  const offset = Number(_offset);

  const names = getNameHierarchy(name);
  const activeName = names[offset];
  if (!activeName) {
    throw new Error(
      `Invariant: findResolverWithUniversalResolver returned an offset (${offset}) larger than the set of possible names in the hierarchy.`,
    );
  }

  return {
    activeName,
    activeResolver,
    // this resolver must have wildcard support if it was not the 0th offset
    requiresWildcardSupport: offset > 0,
  };
}

/**
 * Identifies the active resolver for a given ENS name, using indexed data, following ENSIP-10.
 * This function parallels UniversalResolver#findResolver.
 *
 * @param chainId — the chain ID upon which to find a Resolver
 * @param name - The ENS name to find the Resolver for
 * @returns The resolver ID if found, null otherwise
 *
 * @example
 * ```ts
 * const resolverId = await identifyActiveResolver("sub.example.eth")
 * // Returns: "0x123..." or null if no resolver found
 * ```
 */
async function findResolverWithIndex(chainId: number, name: Name): Promise<FindResolverResult> {
  // 1. construct a hierarchy of names. i.e. sub.example.eth -> [sub.example.eth, example.eth, eth]
  const names = getNameHierarchy(name);

  if (names.length === 0) {
    throw new Error(`findResolverWithIndex: Invalid name provided: '${name}'`);
  }

  // 2. compute node of each via namehash
  const nodes = names.map((name) => namehash(name) as Node);

  // 3. for each domain, find its associated resolver (only on the specified chain)
  const domainResolverRelations = await db.query.ext_domainResolverRelation.findMany({
    where: (drr, { inArray, and, eq }) =>
      and(
        inArray(drr.domainId, nodes), // find Relations for the following Domains
        eq(drr.chainId, chainId), // exclusively on the requested chainId
      ),
    columns: { chainId: true, domainId: true, resolverId: true }, // retrieve resolverId
  });

  // sort into the same order as `nodes`, db results are not guaranteed to match `inArray` order
  domainResolverRelations.sort((a, b) =>
    nodes.indexOf(a.domainId as Node) > nodes.indexOf(b.domainId as Node) ? 1 : -1,
  );

  // 4. iterate up the hierarchy and return the first valid resolver
  for (const drr of domainResolverRelations) {
    // find the first one with a resolver
    if (drr.resolverId !== null) {
      // parse out its address
      const { address: resolverAddress } = parseResolverId(drr.resolverId);

      // NOTE: this zeroAddress check is not strictly necessary, as ENSIndexer encodes a zeroAddress
      // resolver as the _absence_ of a Domain-Resolver relation, so there is no case where a
      // Domain-Resolver relation exists and the resolverAddress is zeroAddress, but we include this
      // check here to encode that explicitly.
      if (isAddressEqual(resolverAddress, zeroAddress)) continue;

      // map the drr's domainId (node) back to its name in `names`
      const offset = nodes.indexOf(drr.domainId as Node);
      const activeName = names[offset];

      // will never occur, exlusively for typechecking
      if (!activeName) {
        throw new Error(
          `Invariant(findResolverWithIndex): activeName could not be determined names = ${JSON.stringify(names)} nodes = ${JSON.stringify(nodes)} active resolver's domainId: ${drr.domainId}.`,
        );
      }

      return {
        activeName,
        activeResolver: resolverAddress,
        // this resolver must have wildcard support if it was not for the first node in our hierarchy
        requiresWildcardSupport: offset > 0,
      };
    }
  }

  // 5. unable to find an active resolver
  return NULL_RESULT;
}
