import { db } from "ponder:api";
import { getENSRootChainId } from "@ensnode/datasources";
import { type Name, Node } from "@ensnode/ensnode-sdk";
import { replaceBigInts } from "ponder";
import { http, createPublicClient, namehash } from "viem";
import { normalize } from "viem/ens";

import { supportsENSIP10Interface } from "@/api/lib/ensip-10";
import { findResolver } from "@/api/lib/find-resolver";
import { possibleKnownOffchainLookupResolverDefersTo } from "@/api/lib/known-offchain-lookup-resolver";
import { getKnownOnchainStaticResolverAddresses } from "@/api/lib/known-onchain-static-resolver";
import {
  executeResolveCalls,
  interpretRawCallsAndResults,
  makeResolveCalls,
} from "@/api/lib/resolve-calls-and-results";
import { areResolverRecordsIndexedOnChain } from "@/api/lib/resolver-records-indexed-on-chain";
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
  options: { chainId?: number; accelerate?: boolean } = {},
): Promise<ResolverRecordsResponse<SELECTION>> {
  const { chainId = ensRootChainId, accelerate = true } = options;

  console.log(
    `— resolveForward(${name}, ${JSON.stringify(selection)}, ${JSON.stringify(options)})`,
  );

  // TODO: need to manage state drift between ENSIndexer and RPC
  // could acquire a "most recently indexed" blockNumber or blockHash for this operation based on
  // ponder indexing status and use that to fix any rpc calls made in this context BUT there's still
  // multiple separate reads to the ENSIndexer schemas so state drift is somewhat unavoidable without
  // locking writes during reads which seems like a really bad idea.
  //
  // but honestly the state drift is at max 1 block on L1 and a block or two on an L2, it's pretty negligible,
  // so maybe we just ignore this issue entirely

  const normalizedName = normalize(name);
  if (name !== normalizedName) {
    throw new Error(`Name "${name}" must be normalized ("${normalizedName}").`);
  }

  // TODO: more name normalization logic (return values of `name` record for example)
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
  // 1. Identify the active resolver for the name on the specified chain.
  //////////////////////////////////////////////////

  const { activeName, activeResolver, requiresWildcardSupport } = await findResolver(chainId, name);

  // we're unable to find an active resolver for this name, return empty response
  if (!activeResolver) {
    console.log(` ❌ findResolver: no active resolver, returning empty response`);
    const response = makeEmptyResolverRecordsResponse(selection);
    console.log(` ↳ ➡️ ${JSON.stringify(response)}`);
    return response;
  }

  console.log(
    ` ↳ findResolver: ${chainId}:${activeResolver} (via ${activeName}), Requires Wildcard? ${requiresWildcardSupport ? "YES" : "NO"}`,
  );

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
  if (accelerate) {
    const defers = possibleKnownOffchainLookupResolverDefersTo(chainId, activeResolver);
    if (defers && !!defers.chainId && config.plugins.includes(defers.pluginName)) {
      console.log(
        ` ↳ ✅ ${chainId}:${activeResolver} is a Known Offchain Lookup Resolver — deferring to ${defers.pluginName} on chain ${defers.chainId}`,
      );

      // can short-circuit CCIP-Read and defer resolution to the specified chainId with the knowledge
      // that ENSIndexer is actively indexing the necessary plugin on the specified chain.
      return resolveForward(name, selection, {
        ...options,
        chainId: defers.chainId,
      });
    }

    console.log(
      ` ↳ ❌ ${chainId}:${activeResolver} is NOT a Known Offchain Lookup Resolver — continuing`,
    );
  }

  //////////////////////////////////////////////////
  // Known On-Chain Static Resolvers
  //   If:
  //    1) activeResolver is a Known Onchain Static Resolver on this chain, and
  //    2) ENSIndexer indexes records for all Resolver contracts on this chain,
  //   then we can retrieve records directly from the database.
  //////////////////////////////////////////////////
  if (accelerate) {
    const isKnownOnchainStaticResolver =
      getKnownOnchainStaticResolverAddresses(chainId).includes(activeResolver);
    if (isKnownOnchainStaticResolver && areResolverRecordsIndexedOnChain(chainId)) {
      console.log(
        ` ↳ ✅ ${chainId}:${activeResolver} is a Known Onchain Static Resolver — retrieving records from ENSIndexer`,
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
      const response = makeRecordsResponseFromIndexedRecords(
        selection,
        // TODO: drizzle types not inferred correctly for addressRecords/textRecords
        resolver as IndexedResolverRecords,
      );
      console.log(` ↳ ➡️ ${JSON.stringify(response)}`);
      return response;
    }

    console.log(
      ` ↳ ❌ ${chainId}:${activeResolver} is NOT a Known Onchain Static Resolver — continuing`,
    );
  }

  //////////////////////////////////////////////////
  // 3. Execute each record's call against the active Resolver.
  //    NOTE: from here, MUST execute EVM code to be compliant with ENS Protocol.
  //    i.e. must execute resolve() to retrieve active record values
  //////////////////////////////////////////////////

  // Invariant: ENSIndexer must have an rpcConfig for the `chainId` we're calling resolve() on.
  const rpcConfig = config.rpcConfigs[chainId];
  if (!rpcConfig) {
    throw new Error(`Invariant: ENSIndexer does not have an RPC to chain id '${chainId}'.`);
  }

  // create an un-cached publicClient
  const publicClient = createPublicClient({ transport: http(rpcConfig.url) });

  // requireResolver() — validate behavior
  const isExtendedResolver = await supportsENSIP10Interface({
    address: activeResolver,
    publicClient,
  });

  if (!isExtendedResolver && requiresWildcardSupport) {
    // requires exact match if not extended resolver
    // TODO: should this return empty response instead?
    throw new Error(
      `The active resolver for '${name}' MUST be a wildcard-capable IExtendedResolver, but ${chainId}:${activeResolver} (via '${activeName}') did not respond correctly to ENSIP-10 Wildcard Resolution supportsInterface().`,
    );
  }

  // execute each record's call against the active Resolver
  const rawResults = await executeResolveCalls<SELECTION>({
    name,
    resolverAddress: activeResolver,
    requiresWildcardSupport,
    calls,
    publicClient,
  });

  console.log(
    ` ↳ ✅ RawResults:\n  ${rawResults.map((result) => JSON.stringify(replaceBigInts(result, (v) => String(v)))).join("\n  ")}`,
  );

  // interpret the results beyond simple return values
  const results = interpretRawCallsAndResults(rawResults);

  // return record values
  const response = makeRecordsResponseFromResolveResults(selection, results);
  console.log(` ↳ ➡️ ${JSON.stringify(response)}`);
  return response;
}
