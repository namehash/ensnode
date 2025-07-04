import { db, publicClients } from "ponder:api";
import {
  DatasourceNames,
  ENSNamespaceIds,
  getDatasource,
  getENSRootChainId,
} from "@ensnode/datasources";
import { type Name, Node } from "@ensnode/ensnode-sdk";
import { Address, namehash } from "viem";

import { supportsENSIP10Interface } from "@/api/lib/ensip-10";
import { findResolver } from "@/api/lib/find-resolver";
import { possibleKnownOffchainLookupResolverDefersTo } from "@/api/lib/known-offchain-lookup-resolver";
import { getKnownOnchainStaticResolverAddresses } from "@/api/lib/known-onchain-static-resolver";
import {
  executeResolveCalls,
  interpretRawCallsAndResults,
  makeResolveCalls,
} from "@/api/lib/resolve-calls-and-results";
import { areResolverRecordsAreIndexedOnChain } from "@/api/lib/resolver-records-indexed-on-chain";
import {
  IndexedResolverRecords,
  ResolverRecordsResponse,
  makeEmptyResolverRecordsResponse,
  makeRecordsResponseFromIndexedRecords,
  makeRecordsResponseFromResolveResults,
} from "@/api/lib/resolver-records-response";
import { ResolverRecordsSelection } from "@/api/lib/resolver-records-selection";
import config from "@/config";
import { makeResolverId } from "@/lib/ids";

const ensRootChainId = getENSRootChainId(config.namespace);

// for all relevant eth_calls here, all Resolver contracts share the same abi, so just grab one from
// @ensnode/datasources that is guaranted to exist
const RESOLVER_ABI = getDatasource(ENSNamespaceIds.Mainnet, DatasourceNames.ENSRoot).contracts
  .Resolver.abi;

/**
 * Implements Forward Resolution of an ENS name, for a selection of records, on a specified chainId.
 *
 * @param name the ENS name to resolve
 * @param selection selection specifying which records to resolve
 * @param chainId optional, the chain id from which to resolve records
 *
 * @example
 * await resolveForward("jesse.base.eth", {
 *   name: true,
 *   addresses: [evmChainIdToCoinType(mainnet.id), evmChainIdToCoinType(base.id)],
 *   texts: ["com.twitter", "description"],
 * })
 *
 * // results in
 * {
 *   name: { name: 'jesse.base.eth' },
 *   addresses: {
 *     60: '0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1',
 *     2147492101: null
 *   },
 *   texts: {
 *     'com.twitter': 'jessepollak',
 *     description: 'base.eth builder #001'
 *   }
 * }
 *
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

  const { activeName, activeResolver, requiresWildcardSupport } = await findResolver(chainId, name);

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
  if (isKnownOnchainStaticResolver && areResolverRecordsAreIndexedOnChain(chainId)) {
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
  const isExtendedResolver = await supportsENSIP10Interface({
    address: activeResolver,
    publicClient,
  });

  if (!isExtendedResolver && requiresWildcardSupport) {
    // requires exact match if not extended resolver
    // TODO: should this return empty response instead?
    throw new Error(
      `The active resolver for '${name}' (via '${activeName}') _must_ be a wildcard-capable IExtendedResolver, but ${activeResolver} on chain id ${chainId} did not respond correctly to ENSIP-10 Wildcard Resolution supportsInterface().`,
    );
  }

  // 2.2 Execute each record's call against the active Resolver
  const rawResults = await executeResolveCalls<SELECTION>({
    name,
    resolverAddress: activeResolver,
    requiresWildcardSupport,
    calls,
    publicClient,
  });

  // interpret the results beyond simple return values
  const results = interpretRawCallsAndResults(rawResults);

  console.log(" ↳ executeResolveCalls:", results);

  // 5. Return record values
  return makeRecordsResponseFromResolveResults(selection, results);
}
