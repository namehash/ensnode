import { resolveForward } from "@/api/lib/forward-resolution";
import { ResolverRecordsResponse, ResolverRecordsSelection } from "@/lib/lib-resolution";
import { EVM_BIT, evmChainIdToCoinType, reverseName } from "@ensnode/ensnode-sdk";
import { Address, Chain, isAddressEqual } from "viem";

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
  // Steps 1-7 — Resolve coinType-specific name and avatar records
  let coinType = evmChainIdToCoinType(chainId);
  let records = await resolveForward(reverseName(address, coinType), REVERSE_SELECTION);

  // Step 8 — Determine if name record exists
  if (!records.name) {
    // Step 9 — Resolve default records if necessary
    coinType = EVM_BIT;
    records = await resolveForward(reverseName(address, coinType), REVERSE_SELECTION);
  }

  // Step 10 — if no name record, there is no Primary Name for this address
  if (!records.name) return null;

  // Step 11 — Resolve address record for the given coinType
  const { addresses } = await resolveForward(records.name, { addresses: [coinType] });
  const resolvedAddress = addresses[coinType] as Address;

  // Step 12 — Check that resolvedAddress matches address
  if (isAddressEqual(resolvedAddress, address)) return records;

  // Step 13 — Otherwise, no Primary Name for this address
  return null;
}
