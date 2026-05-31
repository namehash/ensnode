import type { CoinName } from "@ensdomains/address-encoder";
import { coinNameToTypeMap } from "@ensdomains/address-encoder";
import type { CoinType } from "enssdk";

/**
 * address-encoder coin names for primary-name chains, paired with their canonical
 * GraphQL `ChainName` enum values.
 */
export const CHAIN_NAME_ENTRIES = [
  ["default", "DEFAULT"],
  ["eth", "ETHEREUM"],
  ["base", "BASE"],
  ["op", "OPTIMISM"],
  ["arb1", "ARBITRUM_ONE"],
  ["linea", "LINEA"],
  ["scr", "SCROLL"],
] as const satisfies readonly (readonly [CoinName, string])[];

export type ChainNameCoinName = (typeof CHAIN_NAME_ENTRIES)[number][0];

/** A `ChainName` enum value. */
export type ChainNameValue = (typeof CHAIN_NAME_ENTRIES)[number][1];

export const CHAIN_NAME_VALUES = CHAIN_NAME_ENTRIES.map(
  ([, chain]) => chain,
) as unknown as readonly [ChainNameValue, ...ChainNameValue[]];

/** Canonical ENSIP-9 coin types for primary-name `ChainName` values. */
export const CHAIN_NAME_COIN_TYPES = CHAIN_NAME_ENTRIES.map(
  ([coinName]) => coinNameToTypeMap[coinName] as CoinType,
);

const chainNameToCoinName = Object.fromEntries(
  CHAIN_NAME_ENTRIES.map(([coinName, chain]) => [chain, coinName]),
) as Record<ChainNameValue, ChainNameCoinName>;

/** Maps a `ChainName` enum value to its canonical ENSIP-9 coin type. */
export const chainNameToCoinType = (chain: ChainNameValue): CoinType =>
  coinNameToTypeMap[chainNameToCoinName[chain]] as CoinType;

/** Maps a coin type to a `ChainName` enum value, or null when not represented in `ChainName`. */
export const coinTypeToChainName = (coinType: CoinType): ChainNameValue | null => {
  const entry = CHAIN_NAME_ENTRIES.find(([coinName]) => coinNameToTypeMap[coinName] === coinType);
  if (!entry) return null;
  return entry[1];
};
