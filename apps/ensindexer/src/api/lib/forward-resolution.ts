import { db, publicClients } from "ponder:api";
import config from "@/config";
import { makeResolverId, parseResolverId } from "@/lib/ids";
import {
  IndexedResolverRecords,
  ResolverRecordsResponse,
  ResolverRecordsSelection,
  makeEmptyResolverRecordsResponse,
  makeRecordsResponseFromIndexedRecords,
  makeRecordsResponseFromResolveResults,
} from "@/lib/lib-resolution";
import { getEnsDeploymentChainId } from "@/lib/ponder-helpers";
import { DatasourceName, ENSDeployments, getENSDeployment } from "@ensnode/ens-deployments";
import { type Name, Node, getNameHierarchy } from "@ensnode/ensnode-sdk";
import { Address, ccipRequest, encodeFunctionData, namehash } from "viem";

const deployment = getENSDeployment(config.ensDeploymentChain);
const ensDeploymentChainId = getEnsDeploymentChainId();

// all Resolver contracts share the same abi
const RESOLVER_ABI = ENSDeployments.mainnet.root.contracts.Resolver.abi;

// TODO: implement based on config (& ponder indexing status?)
const isChainIndexed = (chainId: number) => true;

/**
 * A mapping of Resolver Addresses on a given chain to the chain they defer resolution to.
 *
 * These resolvers must abide the following pattern:
 * 1. They _always_ emit OffchainLookup for any resolve() call to a well-known CCIP-Read Gateway
 * 2. That CCIP-Read Gateway exclusively sources the data necessary to process CCIP-Read Requests from
 *   the indicated L2.
 *
 * TODO: these relationships could/should be encoded in an ENSIP
 */
const KNOWN_OFFCHAIN_LOOKUP_RESOLVERS: Record<number, Record<Address, number>> = {
  // on the ENS Deployment Chain
  [deployment.root.chain.id]: {
    // the Basenames L1Resolver defers to Base chain
    // [deployment.root.contracts.BasenamesL1Resolver.address]: deployment.basenames.chain.id,
    // the LineaNames L1Resolver defers to Linea chain
    [deployment.root.contracts.LineaNamesL1Resolver.address]: deployment.lineanames.chain.id,
  },
};

/**
 * A mapping of chain id to addresses that are known Onchain Static Resolvers
 *
 * These resolvers must abide the following pattern:
 * 1. Onchain: all information necessary for resolution is stored on-chain, and
 * 2. Static: All resolve() calls resolve to the exact value previously emitted by the Resolver in
 *    its events (i.e. no post-processing or other logic, a simple return of the on-chain data).
 *
 * TODO: these relationships could/should be encoded in an ENSIP
 */
const KNOWN_ONCHAIN_STATIC_RESOLVERS: Record<number, Address[]> = {
  // on the ENS Deployment Chain
  [deployment.root.chain.id]: [
    // the Root LegacyPublicResolver is an Onchain Static Resolver
    deployment[DatasourceName.Root].contracts.LegacyPublicResolver.address,
    // the Root PublicResolver is an Onchain Static Resolver
    // NOTE: this is also the ENSIP-11 ReverseResolver
    deployment[DatasourceName.Root].contracts.PublicResolver.address,
  ],
  // on the Basenames chain
  [deployment.basenames.chain.id]: [
    // the Basenames L2Resolver is an Onchain Static Resolver
    deployment[DatasourceName.Basenames].contracts.L2Resolver.address,
    // the ENSIP-11 ReverseResolver is an Onchain Static Resolver
    deployment[DatasourceName.ReverseResolverBase].contracts.ReverseResolver.address,
  ],
  // on Linea chain
  [deployment.lineanames.chain.id]: [
    // TODO: additional Linea Onchain Static Resolver? like a PublicResolver equivalent
    // the ENSIP-11 ReverseResolver is an Onchain Static Resolver
    deployment[DatasourceName.ReverseResolverLinea].contracts.ReverseResolver.address,
  ],
  // on Optimism chain
  [deployment["reverse-resolver-optimism"].chain.id]: [
    // the ENSIP-11 ReverseResolver is an Onchain Static Resolver
    deployment[DatasourceName.ReverseResolverOptimism].contracts.ReverseResolver.address,
  ],
  // on Arbitrum chain
  [deployment["reverse-resolver-arbitrum"].chain.id]: [
    // the ENSIP-11 ReverseResolver is an Onchain Static Resolver
    deployment[DatasourceName.ReverseResolverArbitrum].contracts.ReverseResolver.address,
  ],
  [deployment["reverse-resolver-scroll"].chain.id]: [
    // the ENSIP-11 ReverseResolver is an Onchain Static Resolver
    deployment[DatasourceName.ReverseResolverScroll].contracts.ReverseResolver.address,
  ],
};

/**
 * Implements Forward Resolution of an ENS name, for a selection of records, on a specified chainId.
 * TODO: could implement forward for Name | Address and if address perform primary name resolution + verification and continue on
 *
 * @param name the ENS name to resolve
 * @param selection selection specifying which records to resolve
 * @param chainId optional, the chain id from which to resolve records
 *
 * TODO: document with example
 * TODO: tracing/status with reporting to consumer
 */
export async function resolveForward<SELECTION extends ResolverRecordsSelection>(
  name: Name,
  selection: SELECTION,
  chainId: number = ensDeploymentChainId,
): Promise<ResolverRecordsResponse<SELECTION>> {
  console.log("resolveForward", { name, selection, chainId });

  // TODO: need to manage state drift between ENSIndexer and RPC
  // could acquire a "most recently indexed" blockNumber or blockHash for this operation based on
  // ponder indexing status and use that to fix any rpc calls made in this context BUT there's still
  // multiple separate reads to the ENSIndexer schemas so state drift is somewhat unavoidable without
  // locking writes during reads which seems like a really bad idea.
  //
  // but honestly the state drift is at max 1 block on L1 and a block or two on an L2, it's pretty negligible,
  // so maybe we just ignore this issue entirely

  const node: Node = namehash(name);

  //////////////////////////////////////////////////
  // Validate Input
  //////////////////////////////////////////////////

  // construct the set of resolve() calls indicated by selection
  const calls = makeResolveCalls(node, selection);

  // empty selection? invalid input, nothing to do
  if (calls.length === 0) {
    // TODO: maybe return some empty response instead of an error?
    throw new Error(
      `Invalid selection: ${JSON.stringify(selection)} resulted in no resolution calls.`,
    );
  }

  //////////////////////////////////////////////////
  // 1. Identify the active resolver for the name on the specified chain.
  //////////////////////////////////////////////////

  const { activeResolver, requiresWildcardSupport } = await findResolver(name, chainId);

  console.log("findResolver", { activeResolver, requiresWildcardSupport });

  if (!activeResolver) {
    // we're unable to find an active resolver for this name, return empty response
    return makeEmptyResolverRecordsResponse(selection);
  }

  //////////////////////////////////////////////////
  // 2. _resolveBatch with activeResolver, w/ ENSIP-10 Wildcard Resolution support
  //////////////////////////////////////////////////

  //////////////////////////////////////////////////
  // CCIP-Read Short-Circuit for Indexed Chains:
  //   If the activeResolver is a known OffchainLookup Resolver that exclusively defers record
  //   resolution to an indexed L2, we can short-circuit and continue resolving the requested records
  //   directly from that chain.
  //////////////////////////////////////////////////
  const isOffchainLookupResolver = !!KNOWN_OFFCHAIN_LOOKUP_RESOLVERS[chainId]?.[activeResolver];
  if (isOffchainLookupResolver) {
    // NOTE: KNOWN_OFFCHAIN_LOOKUP_RESOLVERS[chainId] is guaranteed to exist via check above
    const deferredToChainId = KNOWN_OFFCHAIN_LOOKUP_RESOLVERS[chainId]![activeResolver];

    console.log("deferring to chain ", { deferredToChainId });

    // can short-circuit CCIP-Read and defer resolution to the specified chainId
    return resolveForward(name, selection, deferredToChainId);
  }

  //////////////////////////////////////////////////
  // Known On-Chain Resolvers
  //   If:
  //    1) activeResolver on this chain is an Onchain Static Resolver, and
  //    2) ENSIndexer indexes this chain,
  //   then we can retrieve records directly from the database.
  //////////////////////////////////////////////////
  const isOnchainStaticResolver = KNOWN_ONCHAIN_STATIC_RESOLVERS[chainId]?.includes(activeResolver);
  if (isOnchainStaticResolver && isChainIndexed(chainId)) {
    console.log("fetching from index");
    const resolverId = makeResolverId(chainId, activeResolver, node);
    const resolver = await db.query.resolver.findFirst({
      where: (resolver, { eq }) => eq(resolver.id, resolverId),
      columns: { name: true },
      with: { addressRecords: true, textRecords: true },
    });

    // Invariant, resolver must exist here
    if (!resolver) {
      throw new Error(
        `Invariant: chain ${chainId} is indexed and active resolver ${activeResolver} was identified, but no resolver exists with id ${resolverId}.`,
      );
    }

    // format into RecordsResponse and return
    // TODO: drizzle types not inferred correctly for addressRecords/textRecords
    return makeRecordsResponseFromIndexedRecords(selection, resolver as IndexedResolverRecords);
  }

  // NOTE: from here, _must_ execute EVM code to be compliant with ENS Protocol.
  // i.e. must execute resolve() to retrieve active record values

  // Invariant: the only chainIds we should be resolving records one at this point are those that
  // ENSIndexer is actively indexing.
  if (!publicClients[chainId]) {
    throw new Error(`Invariant: ENSIndexer does not have an RPC to chain id '${chainId}'.`);
  }

  // 2.1 requireResolver() — validate behavior
  // TODO: implement ERC165 check on this resolver
  const isExtendedResolver = await supportsENSIP10Interface(chainId, activeResolver);
  if (!isExtendedResolver && requiresWildcardSupport) {
    // requires exact match if not extended resolver
    // TODO: should this return empty response instead?
    throw new Error(
      `The active resolver for '${name}' _must_ be a wildcard-capable IExtendedResolver, but ${activeResolver} on chain id ${chainId} did not respond correctly to supportsInterface(___).`,
    );
  }

  // 2.2 For each record to resolve call Resolver.resolve()
  // NOTE: If extended resolver, resolver.resolve(name, data), otherwise just resolver.call(data)
  const resolveResponses = await publicClients[chainId]!.multicall({
    allowFailure: true,
    contracts: calls.map((call) => {
      // NOTE: ENSIP-10
      if (requiresWildcardSupport) {
        return {
          abi: RESOLVER_ABI,
          address: activeResolver,
          functionName: "resolve",
          args: [name, encodeFunctionData({ abi: RESOLVER_ABI, ...call })],
        };
      }

      return {
        abi: RESOLVER_ABI,
        address: activeResolver,
        ...call,
      };
    }),
  });

  console.log("forwardResolve: resolve()", resolveResponses);

  const results = await Promise.all(
    resolveResponses.map(async (response, i) => {
      // 3. Perform CCIP-Read for each OffchainLookup response
      // NOTE: implement x-batch-gateway:true behavior from viem for local gateway batching
      // and execute viem#ccipRequest

      // try {
      //   responses[i] = await ccipRequest({})
      // } catch (err) {
      //   responses[i] = encodeError(err as CcipRequestErrorType)
      // }

      // 4. Execute the CCIP-Read Callback for each necessary OffchainLookup call
      // TODO: can this be skipped/cached for well-known resolvers?
      //   - can be skipped for Base, all it does is gateway server signature verification

      // NOTE: calls[i]! must exist
      return { ...calls[i]!, response };
    }),
  );

  // 5. Return record values
  return makeRecordsResponseFromResolveResults(selection, results);
}

// builds an array of calls from a ResolverRecordsSelection
function makeResolveCalls(node: Node, selection: ResolverRecordsSelection) {
  return [
    // TODO: legacy addr record?
    // selection.addr && ({ functionName: "addr(bytes32)", args: [node] } as const),
    selection.name && ({ functionName: "name", args: [node] } as const),
    ...(selection.addresses ?? []).map(
      (coinType) =>
        ({
          functionName: "addr",
          args: [node, BigInt(coinType)],
        }) as const,
    ),
    ...(selection.texts ?? []).map(
      (key) =>
        ({
          functionName: "text",
          args: [node, key],
        }) as const,
    ),
  ].filter(
    // filter out falsy values, excluding them from the inferred type
    (call): call is Exclude<typeof call, undefined | null | false> => !!call,
  );
}

/**
 * Identifies the active resolver for a given ENS name, following ENSIP-10. This function parallels
 * UniversalResolver#findResolver.
 *
 * @param name - The ENS name to find the resolver for
 * @returns The resolver ID if found, null otherwise
 *
 * @example
 * ```ts
 * const resolverId = await identifyActiveResolver("sub.example.eth")
 * // Returns: "0x123..." or null if no resolver found
 * ```
 */
async function findResolver(
  name: Name,
  chainId: number,
): Promise<
  | {
      activeResolver: null;
      requiresWildcardSupport: undefined;
    }
  | { requiresWildcardSupport: boolean; activeResolver: Address }
> {
  // Invariant: the specified chain must be actively indexed by ENSIndexer
  if (!isChainIndexed(chainId)) {
    throw new Error(
      `Invariant: chainId ${chainId} is not actively indexed by ENSIndexer and it is unable to identify an active resolver for the name '${name}'.`,
    );
  }

  // 1. construct a hierarchy of names. i.e. sub.example.eth -> [sub.example.eth, example.eth, eth]
  const names = getNameHierarchy(name);

  if (names.length === 0) {
    throw new Error(`identifyActiveResolver: Invalid name provided: '${name}'`);
  }

  console.log(` identifyActiveResolver: ${names.join(", ")} on chain ${chainId}`);

  // 2. compute node of each via namehash
  const nodes = names.map((name) => namehash(name) as Node);

  console.log(` identifyActiveResolver: ${nodes.join(", ")}`);

  // 3. for each domain, find its associated resolver (only on the specified chain)
  const domainResolverRelations = await db.query.ext_domainResolverRelation.findMany({
    where: (drr, { inArray, and, eq }) =>
      and(
        inArray(drr.domainId, nodes), // find Relations for the following Domains
        eq(drr.chainId, chainId), // exclusively on the requested chainId
      ),
    columns: { chainId: true, domainId: true, resolverId: true }, // retrieve resolverId
  });

  // sort into the same order as `nodes`
  domainResolverRelations.sort((a, b) =>
    nodes.indexOf(a.domainId as Node) > nodes.indexOf(b.domainId as Node) ? 1 : -1,
  );

  console.log(" identifyActiveResolver", domainResolverRelations);

  for (const drr of domainResolverRelations) {
    // find the first one with a resolver
    if (drr.resolverId !== null) {
      // parse out its address
      const [, resolverAddress] = parseResolverId(drr.resolverId);
      return {
        // this resolver must have wildcard support iff it was not for the first node in our hierarchy
        requiresWildcardSupport: drr.domainId !== nodes[0],
        activeResolver: resolverAddress,
      };
    }
  }

  return { activeResolver: null, requiresWildcardSupport: undefined };
}

async function supportsENSIP10Interface(chainId: number, resolverAddress: Address) {
  try {
    // NOTE: publicClients[chainId] guaranteed to exist
    const supportsInterface = await publicClients[chainId]!.readContract({
      abi: RESOLVER_ABI,
      functionName: "supportsInterface",
      address: resolverAddress,
      // ENSIP-10 Wildcard Resolution interface selector
      // see https://docs.ens.domains/ensip/10
      args: ["0x9061b923"],
    });

    return supportsInterface;
  } catch {
    // this call reverted for whatever reason — this contract does not support the interface
    return false;
  }
}
