import {
  type ChainId,
  type CoinType,
  coinTypeToEvmChainId,
  DEFAULT_EVM_CHAIN_ID,
  DEFAULT_EVM_COIN_TYPE,
  ETH_COIN_TYPE,
  evmChainIdToCoinType,
} from "enssdk";
import { arbitrum, base, linea, optimism, scroll } from "viem/chains";

/** GraphQL `ENSIP19Chain` enum values — chains that can have an ENSIP-19 primary name. */
export const ENSIP19_CHAIN_VALUES = [
  "DEFAULT",
  "ETHEREUM",
  "BASE",
  "OPTIMISM",
  "ARBITRUM",
  "LINEA",
  "SCROLL",
] as const;

export type ENSIP19ChainValue = (typeof ENSIP19_CHAIN_VALUES)[number];

const ENSIP19_CHAIN_TO_COIN_TYPE: Record<ENSIP19ChainValue, CoinType> = {
  DEFAULT: DEFAULT_EVM_COIN_TYPE,
  ETHEREUM: ETH_COIN_TYPE,
  BASE: evmChainIdToCoinType(base.id),
  OPTIMISM: evmChainIdToCoinType(optimism.id),
  ARBITRUM: evmChainIdToCoinType(arbitrum.id),
  LINEA: evmChainIdToCoinType(linea.id),
  SCROLL: evmChainIdToCoinType(scroll.id),
};

/** Maps an `ENSIP19Chain` enum value to its canonical ENSIP-9 coin type. */
export const ensip19ChainToCoinType = (chain: ENSIP19ChainValue): CoinType =>
  ENSIP19_CHAIN_TO_COIN_TYPE[chain];

/** Maps a coin type to an `ENSIP19Chain` enum value, or null when not ENSIP-19 supported. */
export const coinTypeToEnsip19Chain = (coinType: CoinType): ENSIP19ChainValue | null => {
  for (const chain of ENSIP19_CHAIN_VALUES) {
    if (ENSIP19_CHAIN_TO_COIN_TYPE[chain] === coinType) return chain;
  }
  return null;
};

/** Maps an `ENSIP19Chain` enum value to the EVM chain id used for reverse resolution. */
export const ensip19ChainToChainId = (chain: ENSIP19ChainValue): ChainId => {
  if (chain === "DEFAULT") return DEFAULT_EVM_CHAIN_ID;
  return coinTypeToEvmChainId(ensip19ChainToCoinType(chain));
};
