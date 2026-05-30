import { SpanStatusCode, trace } from "@opentelemetry/api";
import {
  type Address,
  type CoinType,
  type DefaultableChainId,
  coinTypeReverseLabel,
  evmChainIdToCoinType,
  reverseName,
} from "enssdk";
import { isAddress, isAddressEqual } from "viem";

import {
  type ResolverRecordsSelection,
  ReverseResolutionProtocolStep,
  type ReverseResolutionResult,
  TraceableENSProtocol,
} from "@ensnode/ensnode-sdk";

import { withActiveSpanAsync } from "@/lib/instrumentation/auto-span";
import {
  addEnsProtocolStepEvent as addProtocolStepEvent,
  withEnsProtocolStep as withProtocolStep,
} from "@/lib/tracing/ens-protocol-tracing-api";

import { resolveForward } from "./forward-resolution";

export const REVERSE_RESOLUTION_SELECTION = {
  name: true,
} as const satisfies ResolverRecordsSelection;

const tracer = trace.getTracer("reverse-resolution");

type ReverseResolutionOptions = Parameters<typeof resolveForward>[2];

/**
 * Implements ENS Reverse Resolution for a specific coin type, including ENSIP-19 L2 Primary Names.
 *
 * @see https://docs.ens.domains/ensip/19/#algorithm
 *
 * @param address the adddress whose Primary Name to resolve
 * @param coinType the coinType within which to resolve the address' Primary Name
 * @param options Optional settings
 * @param options.accelerate Whether to attempt accelerated resolution (default: true)
 * @param options.canAccelerate Whether acceleration is currently possible (default: false)
 */
export async function resolveReverse(
  address: Address,
  coinType: CoinType,
  options: ReverseResolutionOptions,
): Promise<ReverseResolutionResult> {
  const { accelerate = true } = options;

  // trace for external consumers
  return withProtocolStep(
    TraceableENSProtocol.ReverseResolution,
    ReverseResolutionProtocolStep.Operation,
    { address, coinType, accelerate },
    (protocolTracingSpan) =>
      // trace for internal metrics
      withActiveSpanAsync(
        tracer,
        `resolveReverseByCoinType(${address}, coinType: ${coinType})`,
        { address, coinType, accelerate },
        async (span) => {
          /////////////////////////////////////////////////////////
          // Reverse Resolution
          // https://docs.ens.domains/ensip/19/#algorithm
          /////////////////////////////////////////////////////////

          // Steps 1-3 — Resolve coinType-specific name record
          const _reverseName = reverseName(address, coinType);
          const { name } = await withProtocolStep(
            TraceableENSProtocol.ReverseResolution,
            ReverseResolutionProtocolStep.ResolveReverseName,
            { name: _reverseName },
            () => resolveForward(_reverseName, REVERSE_RESOLUTION_SELECTION, options),
          );

          // Step 4 — Determine if name record exists
          addProtocolStepEvent(
            protocolTracingSpan,
            TraceableENSProtocol.ReverseResolution,
            ReverseResolutionProtocolStep.NameRecordExists,
            !!name,
          );
          if (!name) {
            // If name is empty, there is no primary name for this coinType (or default coinType) for this address.
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `No Primary Name for coinType "${coinTypeReverseLabel(coinType)}" or default coinType.`,
            });
            return null;
          }

          // set span's name attribute now that it's guaranteed to exist
          span.setAttribute("name", name);

          // Step 5 — Everything below here is 'step 5'
          // Step 6 — Internally handled as implementation detail of `resolveForward`

          // Step 7 — Resolve the name's address record for the specified coinType
          const { addresses } = await withProtocolStep(
            TraceableENSProtocol.ReverseResolution,
            ReverseResolutionProtocolStep.ForwardResolveAddressRecord,
            { name },
            () => resolveForward(name, { addresses: [coinType] }, options),
          );

          const resolvedAddress = addresses[coinType];

          // Step 8 — Check resolvedAddress validity

          // Step 8.1 — if there's no resolvedAddress, no Primary Name
          const resolvedAddressExists = !!resolvedAddress;
          if (!resolvedAddressExists) {
            addProtocolStepEvent(
              protocolTracingSpan,
              TraceableENSProtocol.ReverseResolution,
              ReverseResolutionProtocolStep.VerifyResolvedAddressMatchesAddress,
              false,
            );

            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `No Resolved Address for coinType "${coinTypeReverseLabel(coinType)}"`,
            });
            return null;
          }

          // set span's resolvedAddress attribute now that it's guaranteed to exist
          span.setAttribute("resolvedAddress", resolvedAddress);

          // Step 8.2 — if the resolvedAddress is not an EVM address, no Primary Name
          const resolvedAddressIsEVMAddress = isAddress(resolvedAddress, { strict: false });
          if (!resolvedAddressIsEVMAddress) {
            addProtocolStepEvent(
              protocolTracingSpan,
              TraceableENSProtocol.ReverseResolution,
              ReverseResolutionProtocolStep.VerifyResolvedAddressMatchesAddress,
              false,
            );

            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `Resolved Address "${resolvedAddress}" is not EVM Address`,
            });
            return null;
          }

          // Step 8.3 — if resolvedAddress does not match expected address, no Primary Name
          const resolvedAddressMatchesAddress = isAddressEqual(resolvedAddress, address);
          if (!resolvedAddressMatchesAddress) {
            addProtocolStepEvent(
              protocolTracingSpan,
              TraceableENSProtocol.ReverseResolution,
              ReverseResolutionProtocolStep.VerifyResolvedAddressMatchesAddress,
              false,
            );

            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `Resolved Address "${resolvedAddress}" does not match ${address}`,
            });
            return null;
          }

          // otherwise
          addProtocolStepEvent(
            protocolTracingSpan,
            TraceableENSProtocol.ReverseResolution,
            ReverseResolutionProtocolStep.VerifyResolvedAddressMatchesAddress,
            true,
          );

          // Step 9 —  name is the Primary Name
          return name;
        },
      ),
  );
}

/**
 * Thin `chainId` wrapper around {@link resolveReverse} for callers at the REST API boundary.
 *
 * @param address The address whose primary name to resolve.
 * @param chainId The EVM chain id for the reverse lookup. `0` is valid as the ENSIP-19 default chain id.
 * @param options Optional resolution settings.
 */
export async function resolveReverseByChainId(
  address: Address,
  chainId: DefaultableChainId,
  options: ReverseResolutionOptions,
): Promise<ReverseResolutionResult> {
  return resolveReverse(address, evmChainIdToCoinType(chainId), options);
}
