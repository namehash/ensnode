import { DEFAULT_EVM_COIN_TYPE, ETH_COIN_TYPE } from "./coin-type";
import { asLiteralLabel, literalLabelsToLiteralName } from "./interpreted-names-and-labels";
import type { CoinType, LiteralLabel, LiteralName, NormalizedAddress } from "./types";

const ADDR_LABEL = asLiteralLabel("addr");
const DEFAULT_LABEL = asLiteralLabel("default");
const REVERSE_LABEL = asLiteralLabel("reverse");

/**
 * Gets the Label used for the reverse names of subnames as per ENSIP-11 & ENSIP-19.
 *
 * @see https://docs.ens.domains/ensip/19/#reverse-resolution
 */
export const addrReverseLabel = (address: NormalizedAddress): LiteralLabel =>
  address.slice(2) as LiteralLabel;

/**
 * Converts `coinType` to prefix-free hex string.
 *
 * @see https://docs.ens.domains/ensip/19
 */
export const coinTypeReverseLabel = (coinType: CoinType): LiteralLabel =>
  coinType.toString(16) as LiteralLabel;

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
export function reverseName(address: NormalizedAddress, coinType: CoinType): LiteralName {
  const label = addrReverseLabel(address);

  const middle = ((): LiteralLabel => {
    switch (coinType) {
      case ETH_COIN_TYPE:
        return ADDR_LABEL;
      case DEFAULT_EVM_COIN_TYPE:
        return DEFAULT_LABEL;
      default:
        return coinTypeReverseLabel(coinType);
    }
  })();

  return literalLabelsToLiteralName([label, middle, REVERSE_LABEL]);
}
