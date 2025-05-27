import { db } from "ponder:api";
import config from "@/config";
import { makeResolverId, parseResolverId } from "@/lib/ids";
import { getEnsDeploymentChainId } from "@/lib/ponder-helpers";
import { DatasourceName, ENSDeployments, getENSDeployment } from "@ensnode/ens-deployments";
import {
  type CoinType,
  ETH_COIN_TYPE,
  type Name,
  Node,
  coinTypeForChainId,
  getNameHierarchy,
} from "@ensnode/utils";
import { Address, Chain, getAddress, isAddressEqual, namehash, toHex } from "viem";
import { base, linea, mainnet } from "viem/chains";

const deployment = getENSDeployment(config.ensDeploymentChain);
const ensDeploymentChainId = getEnsDeploymentChainId();

// all Resolver contracts share the same abi
const RESOLVER_ABI = ENSDeployments.mainnet.root.contracts.Resolver.abi;

const JESSE_NAME = "jesse.base.eth";
const JESSE_NAME_ENCODED = Buffer.from([
  // jesse
  5, 106, 101, 115, 115, 101,
  // base
  4, 98, 97, 115, 101,
  // eth
  3, 101, 116, 104,
  // root
  0,
]);

console.log(JESSE_NAME, JESSE_NAME_ENCODED, toHex(JESSE_NAME_ENCODED));

console.log(
  await resolveForward(JESSE_NAME, {
    name: true,
    addresses: [BigInt(ETH_COIN_TYPE), BigInt(coinTypeForChainId(base.id))],
    texts: ["name", "description", "avatar", "com.twitter"],
  }),
);

// TODO: implement based on config (& ponder indexing status?)
const isChainIndexed = (chainId: number) => true;

// TODO: these relationships could/should be encoded in an ENSIP
const KNOWN_OFFCHAIN_LOOKUP_RESOLVERS: Record<Address, number> = {
  // Root Basenames L1Resolver defers to Base chain
  [deployment.root.contracts.BasenamesL1Resolver.address]: deployment.basenames.chain.id,
  // Root LineaNames L1Resolver defers to Linea chain
  [deployment.root.contracts.LineaNamesL1Resolver.address]: deployment.lineanames.chain.id,
};

// TODO: these relationships could/should be encoded in an ENSIP
const KNOWN_ONCHAIN_RESOLVERS: Record<number, Address[]> = {
  [deployment.root.chain.id]: [
    // the Root PublicResolver is a fully on-chain Resolver
    deployment[DatasourceName.Root].contracts.PublicResolver.address,
  ],
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

export interface ResolverRecordsResponse {
  // TODO: support legacy addr record?
  // addr: string | null;
  name: string | null;
  addresses: { coinType: bigint; address: string }[];
  texts: { key: string; value: string }[];
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

  const isKnownOffchainLookupResolver = !!KNOWN_OFFCHAIN_LOOKUP_RESOLVERS[activeResolver];
  if (isKnownOffchainLookupResolver) {
    const deferredToChainId = KNOWN_OFFCHAIN_LOOKUP_RESOLVERS[activeResolver];
    // can short-circuit CCIP-Read and defer resolution to the specified chainId
    return resolveForward(name, selection, deferredToChainId);
  }

  //////////////////////////////////////////////////
  // Known On-Chain Resolvers
  //   If activeResolver is an on-chain only resolver for this chainId, and we index this chainId
  //   we can retrieve them directly from the database.
  //////////////////////////////////////////////////

  if (isChainIndexed(chainId) && KNOWN_ONCHAIN_RESOLVERS[chainId]?.includes(activeResolver)) {
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
    return {
      name: resolver.name,
      // TODO: addressRecords/textRecords typings
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

  // 2.2 For each record to resolve call Resolver.resolve()
  // NOTE: If extended resolver, resolver.resolve(name, data), otherwise just resolver.call(data)

  // 2.3. If UniversalResolver.resolve() did not revert with OffchainLookup, return records

  // 3. Perform CCIP-Read for indicated gateway servers
  // NOTE: implement x-batch-gateway:true behavior from viem for local gateway batching

  // 3.1. For each OffchainLookup request, execute viem#ccipRequest
  // NOTE: if the gateway is a known L2 on-chain gateway (i.e. exclusively reads from known L2)
  //   AND that specific chain is indexed by ENSIndexer, we can skip this step and access the record values directly

  // 4. Execute the CCIP-Read Batch Callback on UniversalResolver
  // TODO: can this be skipped/cached for well-known resolvers?
  //   - can be skipped for Base, all it does is gateway server signature verification
  // TODO: can we skip the

  // 5. Return record values

  // TODO: Implement forward resolution
  // 1. Get resolver for name
  // 2. Query resolver for each coinType
  // 3. Handle CCIP-Read if needed
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

  // 2. compute node of each via namehash
  const nodes = names.map((name) => namehash(name) as Node);

  // 3. for each domain, find its associated resolver (only on the specified chain)
  const domains = await db.query.ext_domainResolverRelation.findMany({
    where: (drr, { inArray, and, eq }) =>
      and(
        inArray(drr.domainId, nodes), // find Relations for the following Domains
        eq(drr.chainId, chainId), // exclusively on the requested chainId
      ),
    columns: { resolverId: true }, // retrieve resolverId
  });

  for (const [i, domain] of domains.entries()) {
    if (domain.resolverId !== null) {
      const [, resolverAddress] = parseResolverId(domain.resolverId);
      return { requiresWildcardSupport: i !== 0, activeResolver: resolverAddress };
    }
  }

  return { activeResolver: null, requiresWildcardSupport: undefined };
}
