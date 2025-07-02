import { db, publicClients } from "ponder:api";
import { KNOWN_OFFCHAIN_LOOKUP_RESOLVERS } from "@/api/lib/known-offchain-lookup-resolvers";
import { KNOWN_ONCHAIN_STATIC_RESOLVERS } from "@/api/lib/known-onchain-static-resolvers";
import config from "@/config";
import { encodeDNSPacketBytes } from "@/lib/dns-helpers";
import { makeResolverId, parseResolverId } from "@/lib/ids";
import {
  IndexedResolverRecords,
  ResolverRecordsResponse,
  ResolverRecordsSelection,
  makeEmptyResolverRecordsResponse,
  makeRecordsResponseFromIndexedRecords,
  makeRecordsResponseFromResolveResults,
} from "@/lib/lib-resolution";
import {
  DatasourceNames,
  ENSNamespaceIds,
  getDatasource,
  getENSRootChainId,
} from "@ensnode/datasources";
import { type Name, Node, getNameHierarchy } from "@ensnode/ensnode-sdk";
import {
  Address,
  decodeAbiParameters,
  encodeFunctionData,
  getAbiItem,
  isAddress,
  namehash,
  toHex,
} from "viem";

const ensRootChainId = getENSRootChainId(config.namespace);

// for our purposes here, all Resolver contracts share the same abi, so just grab one from datasources
const RESOLVER_ABI = getDatasource(ENSNamespaceIds.Mainnet, DatasourceNames.ENSRoot).contracts
  .Resolver.abi;

// TODO: implement based on config (& ponder indexing status?)
const isChainIndexed = (chainId: number) => true;

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
  chainId: number = ensRootChainId,
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
  const publicClient = publicClients[chainId];
  if (!publicClient) {
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
  // NOTE: viem#readContract implements CCIP-Read, so we get that behavior for free
  // NOTE: viem#multicall doesn't implement CCIP-Read so maybe this can be optimized
  const ResolverContract = { abi: RESOLVER_ABI, address: activeResolver } as const;
  const results = await Promise.all(
    calls.map(async (call) => {
      // NOTE: ENSIP-10 —  If extended resolver, resolver.resolve(name, data)
      if (requiresWildcardSupport) {
        const value = await publicClient.readContract({
          ...ResolverContract,
          functionName: "resolve",
          args: [
            toHex(encodeDNSPacketBytes(name)), // DNS-encode `name` for resolve()
            encodeFunctionData({ abi: RESOLVER_ABI, ...call }),
          ],
        });

        // ENSIP-10 resolve() always returns bytes that need to be decoded
        const results = decodeAbiParameters(
          getAbiItem({ abi: RESOLVER_ABI, name: call.functionName, args: call.args }).outputs,
          value,
        );

        // NOTE: type-guaranteed to have at least 1 result (because each abi item's outputs.length > 0)
        const result = results[0];

        // futher interpret the results
        switch (call.functionName) {
          // make sure address is valid (i.e. specifically not empty bytes)
          case "addr":
            return isAddress(result) ? result : null;
          // coalesce falsy string values to null
          case "name":
          case "text":
            return result || null;
        }
      }

      // discrimminate against the `functionName` type so the inferred types of `readContract` are
      // accurate
      switch (call.functionName) {
        case "name":
          return publicClient.readContract({ ...ResolverContract, ...call });
        case "addr":
          return publicClient.readContract({ ...ResolverContract, ...call });
        case "text":
          return publicClient.readContract({ ...ResolverContract, ...call });
      }
    }),
  );

  // interleave calls and results
  const callsWithResults = calls.map((call, i) => ({ ...call, result: results[i] }));
  console.log("forwardResolve: resolve()", callsWithResults);

  // 5. Return record values
  return makeRecordsResponseFromResolveResults(selection, callsWithResults);
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
