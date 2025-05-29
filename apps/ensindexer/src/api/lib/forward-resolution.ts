import { db } from "ponder:api";
import config from "@/config";
import { makeResolverId, parseResolverId } from "@/lib/ids";
import { getEnsDeploymentChainId } from "@/lib/ponder-helpers";
import { DatasourceName, ENSDeployments, getENSDeployment } from "@ensnode/ens-deployments";
import { type CoinType, type Name, Node, getNameHierarchy } from "@ensnode/ensnode-sdk";
import { Address, namehash } from "viem";

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
 * 1. They _always_ emit OffchainLookup to a well-defined CCIP-Read Gateway
 * 2. The CCIP-Read Gateway exclusively sources the data necessary to process CCIP-Read Requests from
 *   the indicated L2.
 *
 * TODO: these relationships could/should be encoded in an ENSIP
 */
const KNOWN_OFFCHAIN_LOOKUP_RESOLVERS: Record<number, Record<Address, number>> = {
  // on the ENS Deployment Chain
  [deployment.root.chain.id]: {
    // the Basenames L1Resolver defers to Base chain
    [deployment.root.contracts.BasenamesL1Resolver.address]: deployment.basenames.chain.id,
    // the LineaNames L1Resolver defers to Linea chain
    [deployment.root.contracts.LineaNamesL1Resolver.address]: deployment.lineanames.chain.id,
  },
};

/**
 * A mapping of chain id to addresses that are known Onchain Static Resolvers
 *
 * These resolvers must abide the following pattern:
 * 1. Onchain: all information necessary for resolution is stored on-chain, and
 * 2. Static: All resolution is 'static' in that it is a simple return of the emitted values.
 *
 * TODO: these relationships could/should be encoded in an ENSIP
 */
const KNOWN_ONCHAIN_STATIC_RESOLVERS: Record<number, Address[]> = {
  // on the ENS Deployment Chain
  [deployment.root.chain.id]: [
    // the Root PublicResolver is a fully on-chain Resolver
    deployment[DatasourceName.Root].contracts.PublicResolver.address,
  ],
  // on the Basenames chain
  [deployment.basenames.chain.id]: [
    // the Basenames L2Resolver is a fully on-chain Resolver
    deployment[DatasourceName.Basenames].contracts.L2Resolver.address,
  ],
  // TODO: Linea
};

/**
 * Encodes a selection of Resolver records in the context of a specific Node.
 */
export interface ResolverRecordsSelection {
  // TODO: support legacy addr() record?
  // whether to fetch the addr record
  // addr?: boolean;
  // whether to fetch the name record
  name?: boolean;
  // which coinTypes to fetch address records for
  addresses?: CoinType[];
  // which keys to fetch text records for
  texts?: string[];
  // TODO: include others as/if necessary
}

// TODO: document
export interface ResolverRecordsResponse {
  // TODO: support legacy addr record?
  // addr: string | null;
  name: string | null;
  addresses: { coinType: bigint; address: string | null }[];
  texts: { key: string; value: string | null }[];
}

/**
 * Implements Forward Resolution of an ENS name, for a selection of records, on a specified chainId.
 * TODO: could implement forward for Name | Address and if address perform primary name resolution + verification and continue on
 *
 * @param name the ENS name to resolve
 * @param selection selection specifying which records to resolve
 *
 * TODO: document with example
 */
export async function resolveForward(
  name: Name,
  selection: ResolverRecordsSelection,
  chainId: number = ensDeploymentChainId,
): Promise<ResolverRecordsResponse | null> {
  // TODO: should likely acquire a "most recently indexed" blockNumber or blockHash for this operation
  // and use that to fix any rpc calls made in this context

  console.log("resolveForward", { name, selection, chainId });

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

  const { activeResolver, requiresWildcardSupport } = await identifyActiveResolver(name, chainId);

  console.log("identifyActiveResolver", { activeResolver, requiresWildcardSupport });

  if (!activeResolver) {
    // TODO: return empty response?
    throw new Error(`No active resolver found for name '${name}' on chain id ${chainId}.`);
  }

  //////////////////////////////////////////////////
  // 2. _resolveBatch with activeResolver, w/ ENSIP-10 Wildcard Resolution support
  //////////////////////////////////////////////////

  //////////////////////////////////////////////////
  // CCIP-Read Short-Circuit for Indexed Chains:
  //   If the activeResolver is a known OffchainLookup Resolver that exclusively defers record
  //   resolution to a fully on-chain source, we can short-circuit and continue resolving the
  //   requested records directly from that chain.
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
  //   If 1) activeResolver is an on-chain only resolver for this chainId, and 2) ENSIndexer indexes
  //   this chainId we can retrieve records directly from the database.
  //////////////////////////////////////////////////
  const isOnchainStaticResolver = KNOWN_ONCHAIN_STATIC_RESOLVERS[chainId]?.includes(activeResolver);
  if (isOnchainStaticResolver && isChainIndexed(chainId)) {
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

    // TODO: reformat into an ResolverRecordsResponse

    // format into RecordsResponse and return
    return {
      name: resolver.name,
      // TODO: addressRecords/textRecords typings not inferred from drizzle.query — why?
      addresses: (resolver as any).addressRecords as ResolverRecordsResponse["addresses"],
      texts: (resolver as any).textRecords as ResolverRecordsResponse["texts"],
    } satisfies ResolverRecordsResponse;
  }

  // otherwise, must execute Resolver code to determine what to do

  // 2.1 requireResolver() — validate behavior
  // TODO: implement ERC165 check on this resolver
  const isExtendedResolver = true;
  if (!isExtendedResolver && requiresWildcardSupport) {
    // requires exact match if not extended resolver
    throw new Error(
      `The active resolver for '${name}' _must_ be a wildcard-capable IExtendedResolver, but ${activeResolver} on chain id ${chainId} did not respond correctly to supportsInterface(___).`,
    );
  }

  console.log("forwardResolve: CCIP-Read (TODO)");

  // 2.2 For each record to resolve call Resolver.resolve()
  // NOTE: If extended resolver, resolver.resolve(name, data), otherwise just resolver.call(data)

  // 3. Perform CCIP-Read for each OffchainLookup call
  // NOTE: implement x-batch-gateway:true behavior from viem for local gateway batching
  // and execute viem#ccipRequest

  // 4. Execute the CCIP-Read Callback for each necessary OffchainLookup call
  // TODO: can this be skipped/cached for well-known resolvers?
  //   - can be skipped for Base, all it does is gateway server signature verification
  // TODO: can we skip the

  // 5. Return record values
  return null;
}

// builds an array of calls from a ResolverRecordsSelection
function makeResolveCalls(node: Node, selection: ResolverRecordsSelection) {
  return [
    // TODO: legacy addr record?
    // selection.addr && ({ functionName: "addr", args: [node] } as const),
    selection.name && ({ functionName: "name", args: [node] } as const),
    ...(selection.addresses ?? []).map(
      (coinType) =>
        ({
          functionName: "address",
          args: [node, coinType],
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
 * Identifies the active resolver for a given ENS name by traversing the name hierarchy.
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
async function identifyActiveResolver(
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

  console.log(" identifyActiveResolver", domainResolverRelations);

  for (const [i, domain] of domainResolverRelations.entries()) {
    if (domain.resolverId !== null) {
      const [, resolverAddress] = parseResolverId(domain.resolverId);
      return { requiresWildcardSupport: i !== 0, activeResolver: resolverAddress };
    }
  }

  return { activeResolver: null, requiresWildcardSupport: undefined };
}

function makeEmptyResolverRecordsResponse(
  selection: ResolverRecordsSelection,
): ResolverRecordsResponse {
  // TODO: map selection to an empty response that uses null for all values
  // TODO: some typescript magic here for selected fields
  return {
    name: null,
    addresses: (selection.addresses ?? []).map((coinType) => ({ coinType, address: null })),
    texts: (selection.texts ?? []).map((key) => ({ key, value: null })),
  };
}
