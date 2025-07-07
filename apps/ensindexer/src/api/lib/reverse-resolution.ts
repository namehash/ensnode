import { DEFAULT_EVM_COIN_TYPE, evmChainIdToCoinType, reverseName } from "@ensnode/ensnode-sdk";
import { Address, Chain, isAddress, isAddressEqual } from "viem";

import { resolveForward } from "@/api/lib/forward-resolution";
import { ResolverRecordsResponse } from "@/api/lib/resolver-records-response";
import { ResolverRecordsSelection } from "@/api/lib/resolver-records-selection";

const REVERSE_SELECTION = {
  name: true,
  texts: ["avatar"],
} as const satisfies ResolverRecordsSelection;

/**
 * Implements ENS Reverse Resolution, including support for ENSIP-19 L2 Primary Names.
 *
 * @see https://docs.ens.domains/ensip/19#primary-name-resolution-process
 */
export async function resolveReverse(
  address: Address,
  chainId: Chain["id"] = 1,
): Promise<ResolverRecordsResponse<typeof REVERSE_SELECTION> | null> {
  const options = { accelerate: false };

  // Steps 1-7 — Resolve coinType-specific name and avatar records
  let coinType = evmChainIdToCoinType(chainId);
  console.log(`— reverseResolve(${address}, ${coinType})`);
  let records = await resolveForward(reverseName(address, coinType), REVERSE_SELECTION, options);

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
    console.log(
      ` ↳ ⏮️ null — No Primary Name for coinType "${evmChainIdToCoinType(chainId)}" or default coinType.`,
    );
    return null;
  }

  // Step 11 — Resolve address record for the given coinType
  const { addresses } = await resolveForward(records.name, { addresses: [coinType] }, options);
  const resolvedAddress = addresses[coinType];

  // Steps 12-13 — Check resolvedAddress validity

  // if there's no resolvedAddress, no Primary Name
  if (!resolvedAddress) {
    console.log(` ↳ ⏮️ null — No Resolved Address for coinType "${coinType}"`);
    return null;
  }

  // if the resolvedAddress is not an EVM address, no Primary Name
  if (!isAddress(resolvedAddress)) {
    console.log(` ↳ ⏮️ null — Resolved Address "${resolvedAddress}" is not EVM Address`);
    return null;
  }

  // if resolvedAddress does not match expected address, no Primary Name
  if (!isAddressEqual(resolvedAddress, address)) {
    console.log(` ↳ ⏮️ null — Resolved Address "${resolvedAddress}" does not match ${address}`);
    return null;
  }

  // finally, the records are valid for this address
  console.log(` ↳ ⏮️ ${JSON.stringify(records)}`);
  return records;
}
