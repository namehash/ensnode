import { CoinType } from "./types";

/**
 * Derives the coinType for a given chain id according to ENSIP-11.
 *
 * @see https://docs.ens.domains/ensip/11/
 * @see https://github.com/ensdomains/address-encoder/blob/3dd92e192b3ae44b4f8fc505a37fa6280da2b3ad/src/utils/evm.ts#L24
 *
 * @param chainId
 * @returns ENSIP-11 CoinType
 */
export const convertChainIdToCoinType = (chainId: number): CoinType => (0x80000000 | chainId) >>> 0;
