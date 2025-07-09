import { Address } from "viem";
import { DEFAULT_EVM_COIN_TYPE, ETH_COIN_TYPE } from "./constants";
import { CoinType, Label, Name } from "./types";

/**
 * Gets the Label used for the reverse names of subnames as per ENSIP-11 & ENSIP-19.
 *
 * @see https://docs.ens.domains/ensip/19/#reverse-resolution
 */
export const addrReverseLabel = (address: Address): Label => address.slice(2).toLowerCase();

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
export function reverseName(address: Address, coinType: CoinType): Name {
  const label = addrReverseLabel(address);

  const middle = (() => {
    switch (coinType) {
      case ETH_COIN_TYPE:
        return "addr";
      case DEFAULT_EVM_COIN_TYPE:
        return "default";
      default:
        return coinType.toString(16); // hex string, sans 0x prefix
    }
  })();

  return `${label}.${middle}.reverse`;
}
