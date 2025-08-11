import {
  ChainId,
  Name,
  ResolverRecordsSelection,
  ReverseResolutionProtocolStep,
  TraceableENSProtocol,
  coinTypeReverseLabel,
  evmChainIdToCoinType,
  reverseName,
} from "@ensnode/ensnode-sdk";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { Address, isAddress, isAddressEqual } from "viem";

import { addProtocolStepEvent, withProtocolStepAsync } from "@/api/lib/protocol-tracing";
import { withActiveSpanAsync } from "@/lib/auto-span";
import { resolveForward } from "./forward-resolution";

export const REVERSE_RESOLUTION_SELECTION = {
  name: true,
} as const satisfies ResolverRecordsSelection;

const tracer = trace.getTracer("reverse-resolution");

/**
 * Implements ENS Reverse Resolution, including support for ENSIP-19 L2 Primary Names.
 *
 * @see https://docs.ens.domains/ensip/19/#algorithm
 *
 * @param address the adddress whose Primary Name to resolve
 * @param chainId the chainId within which to resolve the address' Primary Name
 */
export async function resolveReverse(
  address: Address,
  chainId: ChainId,
  options: { accelerate?: boolean } = { accelerate: true },
): Promise<Name | null> {
  const { accelerate = true } = options;

  // trace for external consumers
  return withProtocolStepAsync(
    TraceableENSProtocol.ReverseResolution,
    ReverseResolutionProtocolStep.Operation,
    { address, chainId, accelerate },
    (protocolTracingSpan) =>
      // trace for internal metrics
      withActiveSpanAsync(
        tracer,
        `resolveReverse(${address}, chainId: ${chainId})`,
        { address, chainId, accelerate },
        async (span) => {
          /////////////////////////////////////////////////////////
          // Reverse Resolution
          // https://docs.ens.domains/ensip/19/#algorithm
          /////////////////////////////////////////////////////////

          // Steps 1-3 — Resolve coinType-specific name record
          const coinType = evmChainIdToCoinType(chainId);
          const _reverseName = reverseName(address, coinType);
          const { name } = await withProtocolStepAsync(
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
          const { addresses } = await withProtocolStepAsync(
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
          const resolvedAddressIsEVMAddress = isAddress(resolvedAddress);
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
