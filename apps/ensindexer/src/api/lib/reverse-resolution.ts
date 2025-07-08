import { DEFAULT_EVM_COIN_TYPE, evmChainIdToCoinType, reverseName } from "@ensnode/ensnode-sdk";
import { SpanStatusCode, metrics, trace } from "@opentelemetry/api";
import { Address, Chain, isAddress, isAddressEqual } from "viem";

import { resolveForward } from "@/api/lib/forward-resolution";
import { ResolverRecordsResponse } from "@/api/lib/resolver-records-response";
import { ResolverRecordsSelection } from "@/api/lib/resolver-records-selection";
import { ATTR_CODE_FILE_PATH, ATTR_CODE_FUNCTION_NAME } from "@opentelemetry/semantic-conventions";

const REVERSE_SELECTION = {
  name: true,
  texts: ["avatar"],
} as const satisfies ResolverRecordsSelection;

const tracer = trace.getTracer("reverse-resolution");

/**
 * Implements ENS Reverse Resolution, including support for ENSIP-19 L2 Primary Names.
 *
 * @see https://docs.ens.domains/ensip/19#primary-name-resolution-process
 *
 * @param address the adddress to lookup the Primary Name of
 * @param [chainId=1] fetch the Primary Name of the `address` in the context of this `chainId`
 */
export async function resolveReverse(
  address: Address,
  chainId: number = 1,
  options: { accelerate?: boolean } = { accelerate: true },
): Promise<ResolverRecordsResponse<typeof REVERSE_SELECTION> | null> {
  return tracer.startActiveSpan(
    "resolveReverse",
    { attributes: { address, chainId, "options.accelerate": options.accelerate } },
    async (span) => {
      span.setAttribute(ATTR_CODE_FUNCTION_NAME, "resolveReverse");
      span.setAttribute(ATTR_CODE_FILE_PATH, __filename);

      // Steps 1-7 — Resolve coinType-specific name and avatar records
      let coinType = evmChainIdToCoinType(chainId);
      let records = await resolveForward(
        reverseName(address, coinType),
        REVERSE_SELECTION,
        options,
      );

      // Step 8 — Determine if name record exists
      if (!records.name) {
        // Step 9 — Resolve default records if necessary
        // TODO: perhaps this could be optimistically fetched in parallel to above, ensure that coinType
        // is set correctly for whichever records ends up being used
        console.log(
          ` ↳ ⏮️ No Primary Name for coinType "${coinType}", continuing with default coinType...`,
        );
        coinType = DEFAULT_EVM_COIN_TYPE;
        records = await resolveForward(reverseName(address, coinType), REVERSE_SELECTION, options);
      }

      // Step 10 — If no name record, there is no Primary Name for this address
      if (!records.name) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `No Primary Name for coinType "${evmChainIdToCoinType(chainId)}" or default coinType.`,
        });
        return null;
      }

      // Step 11 — Resolve address record for the given coinType
      const { addresses } = await resolveForward(records.name, { addresses: [coinType] }, options);
      const resolvedAddress = addresses[coinType];

      // Steps 12-13 — Check resolvedAddress validity

      // if there's no resolvedAddress, no Primary Name
      if (!resolvedAddress) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `No Resolved Address for coinType "${coinType}"`,
        });
        return null;
      }

      // if the resolvedAddress is not an EVM address, no Primary Name
      if (!isAddress(resolvedAddress)) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `Resolved Address "${resolvedAddress}" is not EVM Address`,
        });
        return null;
      }

      // if resolvedAddress does not match expected address, no Primary Name
      if (!isAddressEqual(resolvedAddress, address)) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `Resolved Address "${resolvedAddress}" does not match ${address}`,
        });
        return null;
      }

      // finally, the records are valid for this address
      span.setAttribute("records", JSON.stringify(records));
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return records;
    },
  );
}
