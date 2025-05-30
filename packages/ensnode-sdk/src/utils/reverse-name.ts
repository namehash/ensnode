import { CoinType } from "@ensdomains/address-encoder";
import { Address } from "viem";
import { ETH_COIN_TYPE, EVM_BIT } from "./constants";
import { Label, Name } from "./types";

/**
 * Gets the Label used for subnames of "addr.reverse" used for reverse lookups of `address` as per
 * https://docs.ens.domains/resolution/names#reverse-nodes
 */
export const addrReverseLabel = (address: Address): Label => address.slice(2).toLowerCase();

/**
 * Gets the reverse name for an address according to ENSIP-11.
 *
 * @see https://docs.ens.domains/ensip/11#specification
 *
 * @param address - The address to get the reverse name for
 * @param coinType - The coin type to use for the reverse name
 * @returns The reverse name for the address
 *
 * @example
 * ```ts
 * reverseName("0x1234...", BigInt(ETH_COIN_TYPE)) // "1234...addr.reverse"
 * reverseName("0x1234...", BigInt(0x80000000)) // "1234...default.reverse"
 * reverseName("0x1234...", BigInt(0x1234)) // "1234...0x1234.reverse"
 * ```
 */

export function reverseName(address: Address, coinType: CoinType): Name {
  const label = addrReverseLabel(address);

  const middle = (() => {
    switch (coinType) {
      case ETH_COIN_TYPE:
        return "addr";
      case EVM_BIT:
        return "default";
      default:
        return coinType.toString(16); // hex string, sans 0x prefix
    }
  })();

  return `${label}.${middle}.reverse`;
}
