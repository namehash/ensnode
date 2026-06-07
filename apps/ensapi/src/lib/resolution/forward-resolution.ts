import { trace } from "@opentelemetry/api";
import {
  type AccountId,
  asInterpretedName,
  asResolvableName,
  ENS_ROOT_NAME,
  isResolvableName,
  type Node,
  namehashInterpretedName,
  type ResolvableName,
} from "enssdk";
import type { PublicClient } from "viem";

import { DatasourceNames, maybeGetDatasource } from "@ensnode/datasources";
import {
  type ForwardResolutionArgs,
  ForwardResolutionProtocolStep,
  type ForwardResolutionResult,
  getDatasourceContract,
  getENSv1RootRegistry,
  type ResolverRecordsSelection,
  TraceableENSProtocol,
  toJson,
} from "@ensnode/ensnode-sdk";
import {
  isBridgedResolver,
  isKnownENSIP19ReverseResolver,
  isStaticResolver,
} from "@ensnode/ensnode-sdk/internal";

import di from "@/di";
import { withActiveSpanAsync } from "@/lib/instrumentation/auto-span";
import { makeLogger } from "@/lib/logger";
import { findResolver } from "@/lib/protocol-acceleration/find-resolver";
import { areResolverRecordsIndexedByProtocolAccelerationPluginOnChainId } from "@/lib/protocol-acceleration/resolver-records-indexed-on-chain";
import { accelerateENSIP19ReverseResolver } from "@/lib/resolution/accelerate-ensip19-reverse-resolver";
import { accelerateKnownOnchainStaticResolver } from "@/lib/resolution/accelerate-known-onchain-static-resolver";
import { executeOperations } from "@/lib/resolution/execute-operations";
import { makeRecordsResponse } from "@/lib/resolution/make-records-response";
import {
  isOperationResolved,
  logOperations,
  makeOperations,
  type Operation,
} from "@/lib/resolution/operations";
import {
  addEnsProtocolStepEvent,
  withEnsProtocolStep,
} from "@/lib/tracing/ens-protocol-tracing-api";

const logger = makeLogger("forward-resolution");
const tracer = trace.getTracer("forward-resolution");

/**
 * Resolves `operations` by delegating wholesale to the UniversalResolver's ENSIP-10 `resolve()` on the
 * ENS Root Chain. The UniversalResolver performs findResolver + ENSIP-10 + CCIP-Read on-chain, so this
 * is the protocol-faithful path whenever ENSApi is not accelerating from indexed data.
 */
async function resolveViaUniversalResolver(
  name: ResolvableName,
  operations: Operation[],
  publicClient: PublicClient,
): Promise<Operation[]> {
  const universalResolver = getDatasourceContract(
    di.context.namespace,
    DatasourceNames.ENSRoot,
    "UniversalResolver",
  );

  return withEnsProtocolStep(
    TraceableENSProtocol.ForwardResolution,
    ForwardResolutionProtocolStep.ExecuteResolveCalls,
    {},
    () =>
      executeOperations({
        name,
        resolverAddress: universalResolver.address,
        operations,
        publicClient,
        useENSIP10Resolve: true,
      }),
  );
}

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
  // we want users to be able to provide unbranded arguments, so we need to enforce our branded
  // invariants here
  // Invariant: the input name must be Resolvable (and therefore Interpreted) to be resolved
  const resolvableName = asResolvableName(asInterpretedName(name));

  // NOTE: `resolveForward` is just `_resolveForward` with the enforcement that `registry` must
  // initially be ENS Root Registry: see `_resolveForward` for additional context.
  return _resolveForward(resolvableName, selection, {
    ...options,
    registry: getENSv1RootRegistry(di.context.namespace),
  });
}

/**
 * Internal Forward Resolution implementation for a given `name`, beginning from the specified
 * `registry`.
 */
async function _resolveForward<SELECTION extends ResolverRecordsSelection>(
  name: ResolvableName,
  selection: ForwardResolutionArgs<SELECTION>["selection"],
  options: { registry: AccountId; accelerate: boolean; canAccelerate: boolean },
): Promise<ForwardResolutionResult<SELECTION>> {
  //////////////////////////////////////////////////
  // Validate Input
  //////////////////////////////////////////////////

  // Invariant: name must conform to ResolvableName
  if (!isResolvableName(name)) {
    throw new Error(`'${name}' must be resolvable.`);
  }

  // TODO: technically we could support resolving records for the root node, but because there
  // are so many edge cases, this is something we should explicitly declare support for
  // after we have test cases
  if (name === ENS_ROOT_NAME) {
    throw new Error(`Resolving records for the ENS Root Node ('') is not currently supported.`);
  }

  const {
    registry: { chainId },
    accelerate = false,
    canAccelerate = false,
  } = options;

  // `selection` may contain bigints (e.g. `abi: ContentType`); stringify safely for tracing.
  const selectionString = toJson(selection);

  const publicClient = di.context.rootChainPublicClient;

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
          // construct the set of resolve() operations indicated by node/selection
          const node = namehashInterpretedName(name);
          let operations = makeOperations(node, selection);
          span.setAttribute("node", node);
          span.setAttribute("operations", toJson(operations));

          // if no operations were generated, this was an empty selection; give them what they asked for
          if (operations.length === 0) return makeRecordsResponse<SELECTION>(operations);

          ////////////////////////////////////////////////////////////////
          /// 0 Non-Accelerated Resolution: delegate to UniversalResolver
          ////////////////////////////////////////////////////////////////

          // whether we can attempt to accelerate this resolution request
          const canAttemptAcceleration = accelerate && canAccelerate;

          // TODO: re-enable protocol acceleration for ENSv2
          const isENSv2Namespace = !!maybeGetDatasource(
            di.context.namespace,
            DatasourceNames.ENSv2Root,
          );

          // when we cannot attempt acceleration or ENSv2 is deployed (temp), delegate to UniversalResolver
          if (!canAttemptAcceleration || isENSv2Namespace) {
            operations = await resolveViaUniversalResolver(name, operations, publicClient);
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
            const bridged = isBridgedResolver(di.context.namespace, resolver);
            if (bridged) {
              return withEnsProtocolStep(
                TraceableENSProtocol.ForwardResolution,
                ForwardResolutionProtocolStep.AccelerateKnownOffchainLookupResolver,
                {},
                () =>
                  _resolveForward(name, selection, {
                    ...options,
                    registry: bridged.targetRegistry,
                  }),
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
            if (isKnownENSIP19ReverseResolver(di.context.namespace, resolver)) {
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
                di.context.namespace,
                chainId,
              );
            if (resolverRecordsAreIndexed && isStaticResolver(di.context.namespace, resolver)) {
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
          // 4. Resolve remaining operations via RPC
          ////////////////////////////////////////////////////////////////////////////

          // On the ENS Root Chain, we have access to the UniversalResolver, so delegate to it
          // rather than calling the discovered resolver directly.
          //
          // The reason for this is that a resolver's on-chain behavior can depend on being
          // called by the canonical UniversalResolver. for example the URTestResolver gates
          // IExtendedResolver support on `msg.sender == UniversalResolver.implementation()` — which
          // ENSApi cannot reproduce off-chain. Delegating keeps Root Chain resolution 1:1 with
          // the on-chain UniversalResolver.
          //
          // Finally, if we are resolving on a shadow Registry chain (e.g. Basenames/Lineanames) for
          // which we have recursed into _resolveForward AND the operations were not resolved above,
          // then we need to execute EVM code, for which calling the UniversalResolver is also the
          // correct approach.
          operations = await resolveViaUniversalResolver(name, operations, publicClient);

          // Invariant: all operations must be resolved
          if (!operations.every(isOperationResolved)) {
            throw new Error(
              `Invariant(forward-resolution): Not all operations were resolved at the end of resolution!\n${toJson(operations, { pretty: true })}`,
            );
          }

          // return records response from operations
          logOperations(operations, logger);
          return makeRecordsResponse<SELECTION>(operations);
        },
      ),
  );
}
