import { db, publicClients } from "ponder:api";
import { findResolver } from "@/api/lib/find-resolver";
import { possibleKnownOffchainLookupResolverDefersTo } from "@/api/lib/known-offchain-lookup-resolver";
import { getKnownOnchainStaticResolverAddresses } from "@/api/lib/known-onchain-static-resolver";
import config from "@/config";
import { encodeDNSPacketBytes } from "@/lib/dns-helpers";
import { makeResolverId } from "@/lib/ids";
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
import { type Name, Node } from "@ensnode/ensnode-sdk";
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

// for all relevant eth_calls here, all Resolver contracts share the same abi, so just grab one from
// @ensnode/datasources that is guaranted to exist
const RESOLVER_ABI = getDatasource(ENSNamespaceIds.Mainnet, DatasourceNames.ENSRoot).contracts
  .Resolver.abi;

/**
 * Determines whether, for a given chain, all Resolver Record Values are indexed.
 *
 * @param chainId
 * @returns
 */
const resolverRecordsAreIndexedOnChain = (chainId: number) => {
  // config.indexAdditionalResolverRecords must be true, or we should defer to the chain
  if (!config.indexAdditionalResolverRecords) return false;

  // TODO: determine if the Resolver/ReverseResolver
  // ideally can do so using the generated ponder config...
  // or perhaps we should restructure the reverse-resolvers plugin to just `resolution` or `all-resolvers`
  // and enforce that it's tracking
  return true;
};

/**
 * Implements Forward Resolution of an ENS name, for a selection of records, on a specified chainId.
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
  console.log(`— resolveForward(${name}, ${JSON.stringify(selection)}, ${chainId})`);

  // TODO: need to manage state drift between ENSIndexer and RPC
  // could acquire a "most recently indexed" blockNumber or blockHash for this operation based on
  // ponder indexing status and use that to fix any rpc calls made in this context BUT there's still
  // multiple separate reads to the ENSIndexer schemas so state drift is somewhat unavoidable without
  // locking writes during reads which seems like a really bad idea.
  //
  // but honestly the state drift is at max 1 block on L1 and a block or two on an L2, it's pretty negligible,
  // so maybe we just ignore this issue entirely

  // TODO: if name not normalized, throw error
  // TODO: need to handle encoded label hashes in name, yeah?

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
  // 1. Identify the active resolver for the name on the specified chain. This requires
  //////////////////////////////////////////////////

  const { activeResolver, requiresWildcardSupport } = await findResolver(chainId, name);

  // we're unable to find an active resolver for this name, return empty response
  if (!activeResolver) {
    console.log(` ↳ findResolver: no active resolver, returning empty response`);
    return makeEmptyResolverRecordsResponse(selection);
  }

  console.log(` ↳ findResolver: ${activeResolver}, Requires Wildcard? ${requiresWildcardSupport}`);

  //////////////////////////////////////////////////
  // 2. _resolveBatch with activeResolver, w/ ENSIP-10 Wildcard Resolution support
  //////////////////////////////////////////////////

  //////////////////////////////////////////////////
  // CCIP-Read Short-Circuit:
  //   If:
  //    1) the activeResolver is a Known OffchainLookup Resolver, and
  //    2) the plugin it defers resolution to is active,
  //   then we can short-circuit the CCIP-Read and continue resolving the requested records directly
  //   from the data indexed by that plugin.
  //////////////////////////////////////////////////
  const defers = possibleKnownOffchainLookupResolverDefersTo(chainId, activeResolver);
  if (defers && config.plugins.includes(defers.pluginName)) {
    console.log(
      ` ↳  ${chainId}:${activeResolver} is Known Offchain Lookup Resolver, deferring to ${defers.pluginName} on chain ${defers.chainId}`,
    );

    // can short-circuit CCIP-Read and defer resolution to the specified chainId with the knowledge
    // that ENSIndexer is actively indexing the necessary plugin on the specified chain.
    return resolveForward(name, selection, defers.chainId);
  }

  //////////////////////////////////////////////////
  // Known On-Chain Static Resolvers
  //   If:
  //    1) activeResolver is a Known Onchain Static Resolver on this chain, and
  //    2) ENSIndexer indexes records for all Resolver contracts on this chain,
  //   then we can retrieve records directly from the database.
  //////////////////////////////////////////////////
  const isKnownOnchainStaticResolver =
    getKnownOnchainStaticResolverAddresses(chainId).includes(activeResolver);
  if (isKnownOnchainStaticResolver && resolverRecordsAreIndexedOnChain(chainId)) {
    console.log(
      ` ↳ ${chainId}:${activeResolver} is a Known Onchain Static Resolver, retrieving records ENSIndexer`,
    );
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

  // Invariant: the only chainIds we should be resolving records on at this point are those that
  // ENSIndexer has an rpcConfig for (i.e. is actively indexing).
  const publicClient = publicClients[chainId];
  if (!publicClient) {
    throw new Error(`Invariant: ENSIndexer does not have an RPC to chain id '${chainId}'.`);
  }

  // 2.1 requireResolver() — validate behavior
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
  // NOTE: viem#multicall doesn't implement CCIP-Read so maybe this can be optimized further
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

      // if not extended resolver, resolve directly
      // NOTE: discrimminate against the `functionName` type to correctly infer return types
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
  console.log("↳ resolve:", callsWithResults);

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
