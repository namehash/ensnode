import { evmChainIdToCoinType as _evmChainIdToCoinType } from "@ensdomains/address-encoder/utils";
import { ETH_COIN_TYPE } from "./constants";
import type { CoinType } from "./types";

// NOTE: for whatever reason @ensdomains/address-encoder#evmChainIdToCoinType doesn't handle the
// mainnet case so we implement that here
export const evmChainIdToCoinType = (chainId: number) => {
  if (chainId === 1) return ETH_COIN_TYPE;
  return _evmChainIdToCoinType(chainId);
};

export const bigintToCoinType = (value: bigint) => {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`'${value}' cannot represent a CoinType, it is too large.`);
  }

  return Number(value) as CoinType;
};
