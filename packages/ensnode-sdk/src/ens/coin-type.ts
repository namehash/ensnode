import type { CoinType, EvmCoinType } from "@ensdomains/address-encoder";
import {
  coinTypeToEvmChainId as _coinTypeToEvmChainId,
  evmChainIdToCoinType as _evmChainIdToCoinType,
} from "@ensdomains/address-encoder/utils";
import { ChainId } from "../shared";

// re-export CoinType and EvmCoinType from @ensdomains/address-encoder
// so consumers don't need it as a dependency
export type { CoinType, EvmCoinType } from "@ensdomains/address-encoder";

/**
 * The ETH coinType.
 *
 * @see https://docs.ens.domains/ensip/9
 */
export const ETH_COIN_TYPE: CoinType = 60;

/**
 * The 'default' chainId corresponding to the below {@link DEFAULT_EVM_COIN_TYPE} in the context of
 * ENSIP-19.
 *
 * @see https://docs.ens.domains/ensip/19
 */
export const DEFAULT_EVM_CHAIN_ID = 0;

/**
 * ENSIP-19 EVM CoinType representing the 'default' coinType for EVM chains in ENS.
 *
 * @see https://docs.ens.domains/ensip/19/#reverse-resolution
 */
export const DEFAULT_EVM_COIN_TYPE = 0x8000_0000 as EvmCoinType;

/**
 * Converts a CoinType to an EVM Chain Id.
 *
 * NOTE: for whatever reason @ensdomains/address-encoder#coinTypeToEvmChainId doesn't handle the
 * mainnet case so we implement that here
 *
 * @see https://docs.ens.domains/ensip/11/
 */
export const coinTypeToEvmChainId = (coinType: CoinType): ChainId => {
  if (coinType === ETH_COIN_TYPE) return 1;
  return _coinTypeToEvmChainId(coinType);
};

/**
 * Converts an EVM Chain Id to a CoinType.
 *
 * NOTE: for whatever reason @ensdomains/address-encoder#evmChainIdToCoinType doesn't handle the
 * mainnet case so we implement that here
 */
export const evmChainIdToCoinType = (chainId: ChainId): CoinType => {
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
export const bigintToCoinType = (value: bigint): CoinType => {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`'${value}' cannot represent as CoinType, it is too large.`);
  }

  return Number(value) as CoinType;
};
