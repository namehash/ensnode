import {
  coinTypeToEvmChainId as _coinTypeToEvmChainId,
  evmChainIdToCoinType as _evmChainIdToCoinType,
} from "@ensdomains/address-encoder/utils";
import { ETH_COIN_TYPE } from "./constants";
import { CoinType } from "./types";

// NOTE: for whatever reason @ensdomains/address-encoder#coinTypeToEvmChainId doesn't handle the
// mainnet case so we implement that here
export const coinTypeToEvmChainId = (coinType: CoinType): number => {
  if (coinType === ETH_COIN_TYPE) return 1;
  return _coinTypeToEvmChainId(coinType);
};

// NOTE: for whatever reason @ensdomains/address-encoder#evmChainIdToCoinType doesn't handle the
// mainnet case so we implement that here
export const evmChainIdToCoinType = (chainId: number): CoinType => {
  if (chainId === 1) return ETH_COIN_TYPE;
  return _evmChainIdToCoinType(chainId);
};

export const bigintToCoinType = (value: bigint) => {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`'${value}' cannot represent as CoinType, it is too large.`);
  }

  return Number(value) as CoinType;
};
