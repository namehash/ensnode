import { getENSRootChainId } from "@ensnode/datasources";
import {
  ForwardResolutionArgs,
  ForwardResolutionProtocolStep,
  ForwardResolutionResult,
  Node,
  PluginName,
  ResolverRecordsResponse,
  ResolverRecordsSelection,
  TraceableENSProtocol,
  isNormalizedName,
  isSelectionEmpty,
  parseReverseName,
} from "@ensnode/ensnode-sdk";
import { trace } from "@opentelemetry/api";
import { replaceBigInts } from "ponder";
import { namehash } from "viem";
import { normalize } from "viem/ens";

import { isKnownENSIP19ReverseResolver } from "@/api/lib/acceleration/known-ensip-19-reverse-resolvers";
import { possibleKnownOffchainLookupResolverDefersTo } from "@/api/lib/acceleration/known-offchain-lookup-resolver";
import { isKnownOnchainStaticResolver } from "@/api/lib/acceleration/known-onchain-static-resolver";
import { areResolverRecordsIndexedOnChain } from "@/api/lib/acceleration/resolver-records-indexed-on-chain";
import { supportsENSIP10Interface } from "@/api/lib/ensip-10";
import { findResolver } from "@/api/lib/find-resolver";
import { getPrimaryNameFromIndex } from "@/api/lib/get-primary-name-from-index";
import { getRecordsFromIndex } from "@/api/lib/get-records-from-index";
import {
  makeEmptyResolverRecordsResponse,
  makeRecordsResponseFromIndexedRecords,
  makeRecordsResponseFromResolveResults,
} from "@/api/lib/make-records-response";
import { addProtocolStepEvent, withProtocolStepAsync } from "@/api/lib/protocol-tracing";
import { getPublicClient } from "@/api/lib/public-client";
import {
  executeResolveCalls,
  interpretRawCallsAndResults,
  makeResolveCalls,
} from "@/api/lib/resolve-calls-and-results";
import config from "@/config";
import { withActiveSpanAsync, withSpanAsync } from "@/lib/auto-span";

const tracer = trace.getTracer("forward-resolution");
// const metric = metrics.getMeter("forward-resolution");

const ensRootChainId = getENSRootChainId(config.namespace);

// NOTE: normalize generic name to force the normalization lib to lazy-load itself (otherwise the
// first trace generated here would be unusually slow)
normalize("example.eth");

/**
 * Implements Forward Resolution of record values for a specified ENS Name.
 *
 * @param name the ENS name to resolve
 * @param selection selection specifying which records to resolve
 * @param options Optional settings
 * @param options.accelerate Whether to accelerate resolution (default: true)
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
 *   name: 'jesse.base.eth',
 *   addresses: {
 *     60: '0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1',
 *     2147492101: null
 *   },
 *   texts: {
 *     'com.twitter': 'jessepollak',
 *     description: 'base.eth builder #001'
 *   }
 * }
 */
export async function resolveForward<SELECTION extends ResolverRecordsSelection>(
  name: ForwardResolutionArgs<SELECTION>["name"],
  selection: ForwardResolutionArgs<SELECTION>["selection"],
  { accelerate }: { accelerate: boolean } = { accelerate: true },
): Promise<ForwardResolutionResult<SELECTION>> {
  // NOTE: `resolveForward` is just `_resolveForward` with the enforcement that `chainId` must
  // initially be `ensRootChainId`: see `_resolveForward` for additional context.
  return _resolveForward(name, selection, { chainId: ensRootChainId, accelerate });
}

/**
 * Internal Forward Resolution implementation.
 *
 * NOTE: uses `chainId` parameter for internal Protocol Acceleration behavior (see recursive call below).
 */
async function _resolveForward<SELECTION extends ResolverRecordsSelection>(
  name: ForwardResolutionArgs<SELECTION>["name"],
  selection: ForwardResolutionArgs<SELECTION>["selection"],
  options: { chainId: number; accelerate: boolean },
): Promise<ForwardResolutionResult<SELECTION>> {
  const { chainId, accelerate = false } = options;
  const selectionString = JSON.stringify(selection);

  // trace for external consumers
  return withProtocolStepAsync(
    TraceableENSProtocol.ForwardResolution,
    ForwardResolutionProtocolStep.Operation,
    { name, selection: selectionString, chainId, accelerate },
    (protocolTracingSpan) =>
      // trace for internal metrics
      withActiveSpanAsync(
        tracer,
        `resolveForward(${name}, chainId: ${chainId})`,
        {
          name,
          selection: selectionString,
          chainId,
          accelerate,
        },
        async (span) => {
          //////////////////////////////////////////////////
          // Validate Input
          //////////////////////////////////////////////////

          // Invariant: Name must be normalized
          if (!isNormalizedName(name)) {
            throw new Error(`Invariant: Name "${name}" must be normalized.`);
          }

          const node: Node = namehash(name);
          span.setAttribute("node", node);

          // if selection is empty, give them what they asked for
          if (isSelectionEmpty(selection)) {
            return makeEmptyResolverRecordsResponse(selection);
          }

          // construct the set of resolve() calls indicated by selection
          const calls = makeResolveCalls(node, selection);
          span.setAttribute("calls", JSON.stringify(replaceBigInts(calls, String)));

          // Invariant: a non-empty selection must have generated some resolve calls
          if (calls.length === 0) {
            throw new Error(
              `Invariant: Selection ${JSON.stringify(selection)} is not empty but resulted in no resolution calls.`,
            );
          }

          //////////////////////////////////////////////////
          // 1. Identify the active resolver for the name on the specified chain.
          //////////////////////////////////////////////////

          // create an un-cached viem#PublicClient separate from ponder's cached/logged clients
          const publicClient = getPublicClient(chainId);

          const { activeName, activeResolver, requiresWildcardSupport } =
            await withProtocolStepAsync(
              TraceableENSProtocol.ForwardResolution,
              ForwardResolutionProtocolStep.FindResolver,
              { name, chainId },
              () => findResolver({ chainId, name, accelerate, publicClient }),
            );

          // 1.2 Determine whether active resolver exists
          addProtocolStepEvent(
            protocolTracingSpan,
            TraceableENSProtocol.ForwardResolution,
            ForwardResolutionProtocolStep.ActiveResolverExists,
            !!activeResolver,
          );
          // we're unable to find an active resolver for this name, return empty response
          if (!activeResolver) {
            return makeEmptyResolverRecordsResponse(selection);
          }

          // set some attributes on the span for easy reference
          span.setAttribute("activeResolver", activeResolver);
          span.setAttribute("activeName", activeName);
          span.setAttribute("requiresWildcardSupport", requiresWildcardSupport);
          span.addEvent("Active Resolver Identified", {
            activeName,
            activeResolver,
            chainId,
            requiresWildcardSupport,
          });

          //////////////////////////////////////////////////
          // 2. _resolveBatch with activeResolver, w/ ENSIP-10 Wildcard Resolution support
          //////////////////////////////////////////////////

          //////////////////////////////////////////////////
          // ENSIP-19 Reverse Resolvers
          //   If:
          //    1) the activeResolver is a Known ENSIP-19 Reverse Resolver, and
          //    2) the ReverseResolvers plugin is active,
          //   then we can just read the name record value directly from the index.
          //////////////////////////////////////////////////
          if (accelerate) {
            const _isKnownENSIP19ReverseResolver = isKnownENSIP19ReverseResolver(
              chainId,
              activeResolver,
            );
            const isIndexingReverseRegistrars = config.plugins.includes(
              PluginName.ReverseResolvers,
            );

            if (_isKnownENSIP19ReverseResolver && isIndexingReverseRegistrars) {
              return withProtocolStepAsync(
                TraceableENSProtocol.ForwardResolution,
                ForwardResolutionProtocolStep.AccelerateENSIP19ReverseResolver,
                {},
                async () => {
                  // Invariant: consumer must be selecting the `name` record at this point
                  if (selection.name !== true) {
                    throw new Error(
                      `Invariant(ENSIP-19 Reverse Resolvers Protocol Acceleration): expected 'name' record in selection but instead received: ${JSON.stringify(selection)}.`,
                    );
                  }

                  // Sanity Check: This should only happen in the context of Reverse Resolution, and
                  // the selection should just be `{ name: true }`, but technically not prohibited to
                  // select more records than just 'name', so just warn if that happens.
                  if (selection.addresses !== undefined || selection.texts !== undefined) {
                    console.warn(
                      `Sanity Check(ENSIP-19 Reverse Resolvers Protocol Acceleration): expected a selection of exactly '{ name: true }' but received ${JSON.stringify(selection)}.`,
                    );
                  }

                  // Invariant: the name in question should be an ENSIP-19 Reverse Name that we're able to parse
                  const parsed = parseReverseName(name);
                  if (!parsed) {
                    throw new Error(
                      `Invariant(ENSIP-19 Reverse Resolvers Protocol Acceleration): expected a valid ENSIP-19 Reverse Name but recieved '${name}'.`,
                    );
                  }

                  // retrieve the name record from the index
                  const nameRecordValue = await getPrimaryNameFromIndex(
                    parsed.address,
                    parsed.coinType,
                  );

                  // NOTE: typecast is ok because of sanity checks above
                  return { name: nameRecordValue } as ResolverRecordsResponse<SELECTION>;
                },
              );
            }

            addProtocolStepEvent(
              protocolTracingSpan,
              TraceableENSProtocol.ForwardResolution,
              ForwardResolutionProtocolStep.AccelerateENSIP19ReverseResolver,
              false,
            );
          }

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
            if (defers && config.plugins.includes(defers.pluginName)) {
              // can short-circuit CCIP-Read and defer resolution to the specified chainId with the knowledge
              // that ENSIndexer is actively indexing the necessary plugin on the specified chain.
              return withProtocolStepAsync(
                TraceableENSProtocol.ForwardResolution,
                ForwardResolutionProtocolStep.AccelerateKnownOffchainLookupResolver,
                {},
                () => _resolveForward(name, selection, { ...options, chainId: defers.chainId }),
              );
            }

            addProtocolStepEvent(
              protocolTracingSpan,
              TraceableENSProtocol.ForwardResolution,
              ForwardResolutionProtocolStep.AccelerateKnownOffchainLookupResolver,
              false,
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
            const _isKnownOnchainStaticResolver = isKnownOnchainStaticResolver(
              chainId,
              activeResolver,
            );

            const resolverRecordsAreIndexed = areResolverRecordsIndexedOnChain(chainId);

            if (_isKnownOnchainStaticResolver && resolverRecordsAreIndexed) {
              return withProtocolStepAsync(
                TraceableENSProtocol.ForwardResolution,
                ForwardResolutionProtocolStep.AccelerateKnownOnchainStaticResolver,
                {},
                async () => {
                  const resolver = await getRecordsFromIndex({
                    chainId,
                    resolverAddress: activeResolver,
                    node,
                    selection,
                  });

                  // if resolver doesn't exist here, there are no records in the index
                  if (!resolver) {
                    return makeEmptyResolverRecordsResponse(selection);
                  }

                  // format into RecordsResponse and return
                  return makeRecordsResponseFromIndexedRecords(selection, resolver);
                },
              );
            }

            addProtocolStepEvent(
              protocolTracingSpan,
              TraceableENSProtocol.ForwardResolution,
              ForwardResolutionProtocolStep.AccelerateKnownOnchainStaticResolver,
              false,
            );
          }

          //////////////////////////////////////////////////
          // 3. Execute each record's call against the active Resolver.
          //    NOTE: from here, MUST execute EVM code to be compliant with ENS Protocol.
          //    i.e. must execute resolve() to retrieve active record values
          //////////////////////////////////////////////////

          // 3.1 requireResolver() — verifies that the resolver supports ENSIP-10 if necessary
          const isExtendedResolver = await withProtocolStepAsync(
            TraceableENSProtocol.ForwardResolution,
            ForwardResolutionProtocolStep.RequireResolver,
            { chainId, activeResolver, requiresWildcardSupport },
            async (span) => {
              const isExtendedResolver = await withSpanAsync(
                tracer,
                "supportsENSIP10Interface",
                { chainId, address: activeResolver },
                () => supportsENSIP10Interface({ address: activeResolver, publicClient }),
              );

              span.setAttribute("isExtendedResolver", isExtendedResolver);

              return isExtendedResolver;
            },
          );

          // if we require wildcard support and this is NOT an extended resolver, the resolver is not
          // valid, i.e. there is no active resolver for the name
          // https://docs.ens.domains/ensip/10/#specification
          if (requiresWildcardSupport && !isExtendedResolver) {
            return makeEmptyResolverRecordsResponse(selection);
          }

          // execute each record's call against the active Resolver
          const rawResults = await withProtocolStepAsync(
            TraceableENSProtocol.ForwardResolution,
            ForwardResolutionProtocolStep.ExecuteResolveCalls,
            {},
            () =>
              executeResolveCalls<SELECTION>({
                name,
                resolverAddress: activeResolver,
                // NOTE: ENSIP-10 specifies that if a resolver supports IExtendedResolver,
                // the client MUST use the ENSIP-10 resolve() method over the legacy methods.
                useENSIP10Resolve: isExtendedResolver,
                calls,
                publicClient,
              }),
          );

          span.setAttribute("rawResults", JSON.stringify(replaceBigInts(rawResults, String)));

          // additional semantic interpretation of the raw results from the chain
          const results = interpretRawCallsAndResults(rawResults);
          span.setAttribute("results", JSON.stringify(replaceBigInts(results, String)));

          // return record values
          return makeRecordsResponseFromResolveResults(selection, results);
        },
      ),
  );
}
