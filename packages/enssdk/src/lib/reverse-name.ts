import { DEFAULT_EVM_COIN_TYPE, ETH_COIN_TYPE } from "./coin-type";
import {
  asInterpretedLabel,
  interpretedLabelsToInterpretedName,
} from "./interpreted-names-and-labels";
import type { CoinType, InterpretedLabel, InterpretedName, NormalizedAddress } from "./types";

const ADDR_LABEL = asInterpretedLabel("addr");
const DEFAULT_LABEL = asInterpretedLabel("default");
const REVERSE_LABEL = asInterpretedLabel("reverse");

/**
 * Gets the Label used for the reverse names of subnames as per ENSIP-11 & ENSIP-19.
 *
 * @see https://docs.ens.domains/ensip/19/#reverse-resolution
 */
export const addrReverseLabel = (address: NormalizedAddress): InterpretedLabel =>
  address.slice(2) as InterpretedLabel;

/**
 * Converts `coinType` to prefix-free hex string.
 *
 * @see https://docs.ens.domains/ensip/19
 */
export const coinTypeReverseLabel = (coinType: CoinType): InterpretedLabel =>
  coinType.toString(16) as InterpretedLabel;

/**
 * Gets the reverse name for an address according to ENSIP-11 & ENSIP-19.
 *
 * @see https://docs.ens.domains/ensip/11#specification
 * @see https://docs.ens.domains/ensip/19#specification
 *
 * @param address - The address to get the reverse name for
 * @param coinType - The coin type to use for the reverse name
 * @returns The reverse name for the address
 *
 * @example
 * ```ts
 * reverseName("0x1234", BigInt(ETH_COIN_TYPE)) // "1234.addr.reverse"
 * reverseName("0x1234", BigInt(0x80000000)) // "1234.default.reverse"
 * reverseName("0x1234", BigInt(0x5678)) // "1234.5678.reverse"
 * ```
 */
export function reverseName(address: NormalizedAddress, coinType: CoinType): InterpretedName {
  const label = addrReverseLabel(address);

  const middle = ((): InterpretedLabel => {
    switch (coinType) {
      case ETH_COIN_TYPE:
        return ADDR_LABEL;
      case DEFAULT_EVM_COIN_TYPE:
        return DEFAULT_LABEL;
      default:
        return coinTypeReverseLabel(coinType);
    }
  })();

  return interpretedLabelsToInterpretedName([label, middle, REVERSE_LABEL]);
}
