import { hexToBigInt } from "viem";

import { toNormalizedAddress } from "./address";
import { bigintToCoinType, DEFAULT_EVM_COIN_TYPE, ETH_COIN_TYPE } from "./coin-type";
import { asLiteralLabel } from "./interpreted-names-and-labels";
import type { CoinType, InterpretedName, LiteralLabel, NormalizedAddress } from "./types";

/**
 * Matches an ENSIP-19 Reverse Name
 *
 * @see https://github.com/ensdomains/ens-contracts/blob/20e34971fd55f9e3b3cf4a5825d52e1504d36493/contracts/utils/ENSIP19.sol#L70
 */
const REVERSE_NAME_REGEX = /^([0-9a-fA-F]+)\.([0-9a-f]{1,64}|addr|default)\.reverse$/;

/**
 * Parses an address label (hex sans prefix) into an Address.
 *
 * @param addressLabel - Lowercase hex string derived from a reverse address.
 * @throws if address is invalid
 * @see https://docs.ens.domains/ensip/19#reverse-resolution
 */
const parseAddressLabel = (addressLabel: LiteralLabel): NormalizedAddress => {
  return toNormalizedAddress(`0x${addressLabel}`);
};

/**
 * Parses a coinType label (hex sans prefix) into an EVMCoinType.
 *
 * @throws if coinType is invalid
 */
const parseCoinTypeLabel = (coinTypeLabel: LiteralLabel): CoinType => {
  if (coinTypeLabel === "default") return DEFAULT_EVM_COIN_TYPE;
  if (coinTypeLabel === "addr") return ETH_COIN_TYPE;

  return bigintToCoinType(hexToBigInt(`0x${coinTypeLabel}`));
};

/**
 * Parse the address and coinType out of an ENSIP-19 reverse name.
 *
 * @dev accepts InterpretedName because all Reverse Names are Interpreted Names and we use this
 *   function in the context of the Resolution module in which all names are InterpretedNames.
 */
export function parseReverseName(name: InterpretedName): {
  address: NormalizedAddress;
  coinType: CoinType;
} | null {
  const match = name.match(REVERSE_NAME_REGEX);
  if (!match) return null;

  try {
    const [, addressLabel, coinTypeLabel] = match;
    if (!addressLabel) return null;
    if (!coinTypeLabel) return null;

    return {
      address: parseAddressLabel(asLiteralLabel(addressLabel)),
      coinType: parseCoinTypeLabel(asLiteralLabel(coinTypeLabel)),
    };
  } catch {
    // either of the parse methods threw, unable to parse reverse name
    return null;
  }
}
