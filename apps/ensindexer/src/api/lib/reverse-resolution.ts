import {
  DEFAULT_EVM_CHAIN_ID,
  DEFAULT_EVM_COIN_TYPE,
  Name,
  ReverseResolutionProtocolStep,
  TraceableENSProtocol,
  evmChainIdToCoinType,
  reverseName,
} from "@ensnode/ensnode-sdk";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { Address, isAddress, isAddressEqual } from "viem";

import { resolveForward } from "@/api/lib/forward-resolution";
import { addProtocolStepEvent, withProtocolStepAsync } from "@/api/lib/protocol-tracing";
import { ResolverRecordsResponse } from "@/api/lib/resolver-records-response";
import { ResolverRecordsSelection } from "@/api/lib/resolver-records-selection";
import { withActiveSpanAsync } from "@/lib/auto-span";

const REVERSE_SELECTION = {
  name: true,
} as const satisfies ResolverRecordsSelection;

const tracer = trace.getTracer("reverse-resolution");

/**
 * Implements ENS Reverse Resolution, including support for ENSIP-19 L2 Primary Names.
 *
 * @see https://docs.ens.domains/ensip/19/#reverse-resolution
 *
 * @param address the adddress to lookup the Primary Name of
 * @param [chainId=0] the chainId context to fetch the Primary Name in, defaulting to the 'default' Primary Name
 */
export async function resolveReverse(
  address: Address,
  chainId: number = DEFAULT_EVM_CHAIN_ID,
  options: { accelerate?: boolean } = { accelerate: true },
): Promise<Name | null> {
  // trace for external consumers
  return withProtocolStepAsync(
    TraceableENSProtocol.ReverseResolution,
    ReverseResolutionProtocolStep.Operation,
    (protocolTracingSpan) =>
      // trace for internal metrics
      withActiveSpanAsync(
        tracer,
        `resolveReverse(${address}, chainId: ${chainId})`,
        { address, chainId, "ens.protocol": TraceableENSProtocol.ReverseResolution },
        async (span) => {
          /////////////////////////////////////////////////////////
          // 'Reverse Resoltion' Steps
          // https://docs.ens.domains/ensip/19/#reverse-resolution
          /////////////////////////////////////////////////////////

          // Steps 1-3 — Resolve coinType-specific name record
          const coinType = evmChainIdToCoinType(chainId);
          span.addEvent(`Resolving records for coinType "${coinType}"...`);
          const { name } = await withProtocolStepAsync(
            TraceableENSProtocol.ReverseResolution,
            ReverseResolutionProtocolStep.ForwardResolveCoinType,
            () => resolveForward(reverseName(address, coinType), REVERSE_SELECTION, options),
          );

          // Step 4 — If no name record, there is no Primary Name for this address
          addProtocolStepEvent(
            protocolTracingSpan,
            TraceableENSProtocol.ReverseResolution,
            ReverseResolutionProtocolStep.NameRecordExists,
            !!name,
          );
          if (!name) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `No Primary Name for coinType "${evmChainIdToCoinType(chainId)}" or default coinType.`,
            });
            return null;
          }

          span.setAttribute("name", name);

          /////////////////////////////////////////////////////////
          // 'Forward Resoltion' Steps
          // https://docs.ens.domains/ensip/19/#forward-resolution
          /////////////////////////////////////////////////////////

          // Steps 1-2 — Resolve address record for the given coinType
          span.addEvent(`Resolving address for name "${name}" and coinType "${coinType}"...`);
          const { addresses } = await withProtocolStepAsync(
            TraceableENSProtocol.ReverseResolution,
            ReverseResolutionProtocolStep.ForwardResolveAddressRecord,
            () => resolveForward(name, { addresses: [coinType] }, options),
          );

          const resolvedAddress = addresses[coinType];

          // Step 3 — Check resolvedAddress validity

          // if there's no resolvedAddress, no Primary Name
          const resolvedAddressExists = !!resolvedAddress;
          addProtocolStepEvent(
            protocolTracingSpan,
            TraceableENSProtocol.ReverseResolution,
            ReverseResolutionProtocolStep.VerifyResolvedAddressExistence,
            resolvedAddressExists,
          );
          if (!resolvedAddressExists) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `No Resolved Address for coinType "${coinType}"`,
            });
            return null;
          }

          // if the resolvedAddress is not an EVM address, no Primary Name
          const resolvedAddressIsEVMAddress = isAddress(resolvedAddress);
          addProtocolStepEvent(
            protocolTracingSpan,
            TraceableENSProtocol.ReverseResolution,
            ReverseResolutionProtocolStep.VerifyResolvedAddressValidity,
            resolvedAddressIsEVMAddress,
          );
          if (!resolvedAddressIsEVMAddress) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `Resolved Address "${resolvedAddress}" is not EVM Address`,
            });
            return null;
          }

          // if resolvedAddress does not match expected address, no Primary Name
          const resolvedAddressMatchesAddress = isAddressEqual(resolvedAddress, address);
          addProtocolStepEvent(
            protocolTracingSpan,
            TraceableENSProtocol.ReverseResolution,
            ReverseResolutionProtocolStep.VerifyResolvedAddressMatchesAddress,
            resolvedAddressIsEVMAddress,
          );
          if (!resolvedAddressMatchesAddress) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `Resolved Address "${resolvedAddress}" does not match ${address}`,
            });
            return null;
          }

          // finally, the name is considered a valid Primary Name for this address
          return name;
        },
      ),
  );
}
