import { mainnet } from "viem/chains";
import { ETH_COIN_TYPE } from "./constants";
import { CoinType, EVMCoinType } from "./types";

// https://docs.ens.domains/ensip/11#specification
export const EVM_BIT = 1 << 31;

/**
 * Derives the coinType for a given chain id according to ENSIP-11.
 *
 * @see https://docs.ens.domains/ensip/11/
 * @see https://github.com/ensdomains/address-encoder/blob/3dd92e192b3ae44b4f8fc505a37fa6280da2b3ad/src/utils/evm.ts#L24
 *
 * @param chainId
 * @returns ENSIP-11 CoinType
 */
export const evmCoinTypeForChainId = (chainId: number): EVMCoinType => {
  if (chainId === mainnet.id) return ETH_COIN_TYPE;
  return 0x80000000 | (chainId >>> 0);
};

/**
 * Converts an ENSIP-11 EVMCoinType to its corresponding EVM chain ID.
 *
 * @see https://docs.ens.domains/ensip/11#specification
 *
 * @param coinType - The ENSIP-11 CoinType to convert
 * @returns The corresponding EVM chain ID
 */
export const chainIdForCoinType = (coinType: EVMCoinType): number => {
  if (coinType === ETH_COIN_TYPE) return mainnet.id;
  return (0x7fffffff & coinType) >> 0;
};

export function toEVMCoinType(coinType: CoinType): EVMCoinType {
  if (coinType > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${coinType} is too large to represent an EVMCoinType`);
  }

  return Number(coinType);
}

/**
 * Checks if a given coinType is a valid EVM coinType according to ENSIP-19.
 *
 * @see https://github.com/ensdomains/ens-contracts/blob/staging/contracts/utils/ENSIP19.sol#L39
 * @param coinType - The coinType to check
 * @returns true if the coinType is a valid EVM coinType, false otherwise
 */
export function isEVMCoinType(coinType: CoinType): boolean {
  try {
    const evmCoinType = toEVMCoinType(coinType); // throws if not EMVCoinType-compatible
    return chainIdForCoinType(evmCoinType) !== 0 || evmCoinType === EVM_BIT;
  } catch {
    return false;
  }
}
