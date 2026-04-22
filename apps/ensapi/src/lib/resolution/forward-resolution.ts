import config from "@/config";

import { trace } from "@opentelemetry/api";
import { replaceBigInts } from "@ponder/utils";
import {
  type AccountId,
  asInterpretedName,
  ENS_ROOT_NAME,
  type InterpretedName,
  isNormalizedName,
  type Node,
  namehashInterpretedName,
} from "enssdk";

import { DatasourceNames } from "@ensnode/datasources";
import {
  type ForwardResolutionArgs,
  ForwardResolutionProtocolStep,
  type ForwardResolutionResult,
  getDatasourceContract,
  getENSv1Registry,
  maybeGetDatasourceContract,
  PluginName,
  type ResolverRecordsSelection,
  TraceableENSProtocol,
} from "@ensnode/ensnode-sdk";
import {
  isBridgedResolver,
  isExtendedResolver,
  isKnownENSIP19ReverseResolver,
  isStaticResolver,
} from "@ensnode/ensnode-sdk/internal";

import { withActiveSpanAsync, withSpanAsync } from "@/lib/instrumentation/auto-span";
import { lazy } from "@/lib/lazy";
import { makeLogger } from "@/lib/logger";
import { findResolver } from "@/lib/protocol-acceleration/find-resolver";
import { areResolverRecordsIndexedByProtocolAccelerationPluginOnChainId } from "@/lib/protocol-acceleration/resolver-records-indexed-on-chain";
import { getPublicClient } from "@/lib/public-client";
import { accelerateENSIP19ReverseResolver } from "@/lib/resolution/accelerate-ensip19-reverse-resolver";
import { accelerateKnownOnchainStaticResolver } from "@/lib/resolution/accelerate-known-onchain-static-resolver";
import { executeOperations } from "@/lib/resolution/execute-operations";
import { makeRecordsResponse } from "@/lib/resolution/make-records-response";
import { isOperationResolved, logOperations, makeOperations } from "@/lib/resolution/operations";
import {
  addEnsProtocolStepEvent,
  withEnsProtocolStep,
} from "@/lib/tracing/ens-protocol-tracing-api";

const logger = makeLogger("forward-resolution");
const tracer = trace.getTracer("forward-resolution");

const getUniversalResolverV1 = lazy(() =>
  getDatasourceContract(config.namespace, DatasourceNames.ENSRoot, "UniversalResolver"),
);

const getUniversalResolverV2 = lazy(() =>
  maybeGetDatasourceContract(config.namespace, DatasourceNames.ENSRoot, "UniversalResolverV2"),
);

/**
 * Implements Forward Resolution of record values for a specified ENS Name.
 *
 * @param name the ENS name to resolve
 * @param selection selection specifying which records to resolve
 * @param options Optional settings
 * @param options.accelerate Whether acceleration is requested (default: true)
 * @param options.canAccelerate Whether acceleration is currently possible (default: false)
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
  options: Omit<Parameters<typeof _resolveForward>[2], "registry">,
): Promise<ForwardResolutionResult<SELECTION>> {
  // Invariant: Name must be an InterpretedName
  const interpretedName = asInterpretedName(name);

  // NOTE: `resolveForward` is just `_resolveForward` with the enforcement that `registry` must
  // initially be ENS Root Registry: see `_resolveForward` for additional context.
  return _resolveForward(interpretedName, selection, {
    ...options,
    registry: getENSv1Registry(config.namespace),
  });
}

/**
 * Internal Forward Resolution implementation for a given `name`, beginning from the specified
 * `registry`.
 */
async function _resolveForward<SELECTION extends ResolverRecordsSelection>(
  name: InterpretedName,
  selection: ForwardResolutionArgs<SELECTION>["selection"],
  options: { registry: AccountId; accelerate: boolean; canAccelerate: boolean },
): Promise<ForwardResolutionResult<SELECTION>> {
  const {
    registry: { chainId },
    accelerate = false,
    canAccelerate = false,
  } = options;

  // `selection` may contain bigints (e.g. `abi: ContentType`); stringify safely for tracing.
  const selectionString = JSON.stringify(replaceBigInts(selection, String));

  // trace for external consumers
  return withEnsProtocolStep(
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

          // TODO: technically InterpretedNames are not resolvable, since ENS contracts are not
          // encoded-labelhash-aware; so we add a temporary additional constraint on name that it
          // must be fully normalized (and therefore not contain encoded labelhash segments)
          // (this will be improved in a future pr https://github.com/namehash/ensnode/issues/1920)
          if (!isNormalizedName(name)) {
            throw new Error(`'${name}' must be normalized to be resolvable.`);
          }

          // TODO: technically we could support resolving records for the root node, but because there
          // are so many edge cases, this is something we should explicitly declare support for
          // after we have test cases
          if (name === ENS_ROOT_NAME) {
            throw new Error(
              `Resolving records for the ENS Root Node ('') is not currently supported.`,
            );
          }

          const node: Node = namehashInterpretedName(name);
          span.setAttribute("node", node);

          // construct the set of resolve() operations indicated by node/selection
          let operations = makeOperations(node, selection);
          span.setAttribute("operations", JSON.stringify(replaceBigInts(operations, String)));

          // if no operations were generated, this was an empty selection; give them what they asked for
          if (operations.length === 0) return makeRecordsResponse<SELECTION>(operations);

          const publicClient = getPublicClient(chainId);

          ////////////////////////////
          /// 0. Temporary ENSv2 Bailout
          ////////////////////////////
          // TODO: re-enable protocol acceleration for ENSv2
          if (config.ensIndexerPublicConfig.plugins.includes(PluginName.ENSv2)) {
            const UniversalResolverAddress =
              getUniversalResolverV2()?.address ?? getUniversalResolverV1().address;
            operations = await withEnsProtocolStep(
              TraceableENSProtocol.ForwardResolution,
              ForwardResolutionProtocolStep.ExecuteResolveCalls,
              {},
              () =>
                executeOperations({
                  name,
                  resolverAddress: UniversalResolverAddress,
                  operations,
                  publicClient,
                  useENSIP10Resolve: true,
                }),
            );

            logOperations(operations, logger);
            return makeRecordsResponse<SELECTION>(operations);
          }

          ///////////////////////////
          // 1. Find Active Resolver
          ///////////////////////////
          const { activeName, activeResolver, requiresWildcardSupport } = await withEnsProtocolStep(
            TraceableENSProtocol.ForwardResolution,
            ForwardResolutionProtocolStep.FindResolver,
            { name, chainId },
            () =>
              findResolver({
                registry: options.registry,
                name,
                accelerate,
                canAccelerate,
                publicClient,
              }),
          );

          // 1.2 Determine whether active resolver exists
          addEnsProtocolStepEvent(
            protocolTracingSpan,
            TraceableENSProtocol.ForwardResolution,
            ForwardResolutionProtocolStep.ActiveResolverExists,
            !!activeResolver,
          );
          // we're unable to find an active resolver for this name, return empty response
          if (!activeResolver) return makeRecordsResponse<SELECTION>(operations);

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

          /////////////////////////////////////
          // 2. Bridged Resolver short-circuit
          /////////////////////////////////////
          if (accelerate && canAccelerate) {
            const resolver = { chainId, address: activeResolver };
            const bridgesTo = isBridgedResolver(config.namespace, resolver);
            if (bridgesTo) {
              return withEnsProtocolStep(
                TraceableENSProtocol.ForwardResolution,
                ForwardResolutionProtocolStep.AccelerateKnownOffchainLookupResolver,
                {},
                () => _resolveForward(name, selection, { ...options, registry: bridgesTo }),
              );
            }

            addEnsProtocolStepEvent(
              protocolTracingSpan,
              TraceableENSProtocol.ForwardResolution,
              ForwardResolutionProtocolStep.AccelerateKnownOffchainLookupResolver,
              false,
            );
          }

          //////////////////////////////////////////////////
          // 3. Accelerate if possible — each strategy is its own pass over operations.
          //////////////////////////////////////////////////
          if (accelerate && canAccelerate) {
            const resolver = { chainId, address: activeResolver };

            // Pass: ENSIP-19 Reverse Resolver
            if (isKnownENSIP19ReverseResolver(config.namespace, resolver)) {
              operations = await withEnsProtocolStep(
                TraceableENSProtocol.ForwardResolution,
                ForwardResolutionProtocolStep.AccelerateENSIP19ReverseResolver,
                {},
                () => accelerateENSIP19ReverseResolver({ operations, name, selection }),
              );
            }

            // Pass: Known On-Chain Static Resolver with indexed records
            const resolverRecordsAreIndexed =
              areResolverRecordsIndexedByProtocolAccelerationPluginOnChainId(
                config.namespace,
                chainId,
              );
            if (resolverRecordsAreIndexed && isStaticResolver(config.namespace, resolver)) {
              operations = await withEnsProtocolStep(
                TraceableENSProtocol.ForwardResolution,
                ForwardResolutionProtocolStep.AccelerateKnownOnchainStaticResolver,
                {},
                () =>
                  accelerateKnownOnchainStaticResolver({ operations, resolver, node, selection }),
              );
            } else {
              addEnsProtocolStepEvent(
                protocolTracingSpan,
                TraceableENSProtocol.ForwardResolution,
                ForwardResolutionProtocolStep.AccelerateKnownOnchainStaticResolver,
                false,
              );
            }
          }

          // early return if every operation is resolved
          if (operations.every(isOperationResolved)) {
            logOperations(operations, logger);
            return makeRecordsResponse<SELECTION>(operations);
          }

          ////////////////////////////////////////////////////////////////////////////
          // 4. Determine Resolver ENSIP-10 support + requirement.
          //    From here, we MUST execute EVM code to be compliant with ENS Protocol
          ////////////////////////////////////////////////////////////////////////////
          const extended = await withEnsProtocolStep(
            TraceableENSProtocol.ForwardResolution,
            ForwardResolutionProtocolStep.RequireResolver,
            { chainId, activeResolver, requiresWildcardSupport },
            async (stepSpan) => {
              const extended = await withSpanAsync(
                tracer,
                "isExtendedResolver",
                { chainId, address: activeResolver },
                () => isExtendedResolver({ address: activeResolver, publicClient }),
              );

              stepSpan.setAttribute("isExtendedResolver", extended);

              return extended;
            },
          );

          // if we require wildcard support and this is NOT an extended resolver, the resolver is
          // not valid, i.e. there is no active resolver for the name
          // https://docs.ens.domains/ensip/10/#specification
          if (requiresWildcardSupport && !extended) {
            return makeRecordsResponse<SELECTION>(operations);
          }

          ///////////////////////////////////////////
          // 5. Resolve remaining operations via RPC
          ///////////////////////////////////////////
          operations = await withEnsProtocolStep(
            TraceableENSProtocol.ForwardResolution,
            ForwardResolutionProtocolStep.ExecuteResolveCalls,
            {},
            () =>
              executeOperations({
                name,
                resolverAddress: activeResolver,
                // NOTE: ENSIP-10 specifies that if a resolver supports IExtendedResolver,
                // the client MUST use the ENSIP-10 resolve() method over the legacy methods.
                useENSIP10Resolve: extended,
                operations,
                publicClient,
              }),
          );

          // Invariant: all operations must be resolved
          if (!operations.every(isOperationResolved)) {
            throw new Error(
              `Invariant(forward-resolution): Not all operations were resolved at the end of resolution!\n${JSON.stringify(replaceBigInts(operations, String))}`,
            );
          }

          // return record values
          logOperations(operations, logger);
          return makeRecordsResponse<SELECTION>(operations);
        },
      ),
  );
}
