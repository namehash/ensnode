import type { NormalizedAddress } from "enssdk";
import { isAddressEqual, zeroAddress } from "viem";

/**
 * Interprets a NormalizedAddress. zeroAddress is interpreted as null, otherwise as-is.
 */
export const interpretAddress = (owner: NormalizedAddress): NormalizedAddress | null =>
  isAddressEqual(zeroAddress, owner) ? null : owner;
