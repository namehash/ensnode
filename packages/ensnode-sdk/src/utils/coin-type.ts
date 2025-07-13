import {
  coinTypeToEvmChainId as _coinTypeToEvmChainId,
  evmChainIdToCoinType as _evmChainIdToCoinType,
} from "@ensdomains/address-encoder/utils";
import { ETH_COIN_TYPE } from "./constants";
import type { CoinType } from "./types";

/**
 * Converts a CoinType to an EVM Chain Id.
 *
 * NOTE: for whatever reason @ensdomains/address-encoder#coinTypeToEvmChainId doesn't handle the
 * mainnet case so we implement that here
 *
 * @see https://docs.ens.domains/ensip/11/
 */
export const coinTypeToEvmChainId = (coinType: CoinType): number => {
  if (coinType === ETH_COIN_TYPE) return 1;
  return _coinTypeToEvmChainId(coinType);
};

/**
 * Converts an EVM Chain Id to a CoinType.
 *
 * NOTE: for whatever reason @ensdomains/address-encoder#evmChainIdToCoinType doesn't handle the
 * mainnet case so we implement that here
 *
 * @param chainId
 * @returns
 */
export const evmChainIdToCoinType = (chainId: number): CoinType => {
  if (chainId === 1) return ETH_COIN_TYPE;
  return _evmChainIdToCoinType(chainId);
};

/**
 * Converts a bigint value representing a CoinType into a valid CoinType.
 *
 * This is useful when onchain events emit coinTypes as bigint but we want to constrain them to
 * the CoinType type.
 *
 * @throws if `value` is too large to fit in Number.MAX_SAFE_INTEGER
 */
export const bigintToCoinType = (value: bigint) => {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`'${value}' cannot represent as CoinType, it is too large.`);
  }

  return Number(value) as CoinType;
};
