import { Address } from "viem";
import { CoinType, Label, Name } from "./types";

const SLUG_ETH = "addr"; // <=> COIN_TYPE_ETH
const SLUG_DEFAULT = "default"; // <=> EVM_BIT
const TLD_REVERSE = "reverse";

/**
 * Gets the Label used for subnames of "addr.reverse" used for reverse lookups of `address` as per
 * https://docs.ens.domains/resolution/names#reverse-nodes
 */
export const addrReverseLabel = (address: Address): Label => address.slice(2).toLowerCase();

export function reverseName(address: Address, coinType: CoinType): Name {
  const label = addrReverseLabel(address);

  coinType == COIN_TYPE_ETH
    ? SLUG_ETH
    : coinType == EVM_BIT
      ? SLUG_DEFAULT
      : HexUtils.unpaddedUintToHex(coinType, true);

  return `${label}.${middle}.${TLD_REVERSE}`;
}
