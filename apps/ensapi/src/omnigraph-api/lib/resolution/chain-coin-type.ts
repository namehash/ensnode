import type { CoinName } from "@ensdomains/address-encoder";
import { coinNameToTypeMap } from "@ensdomains/address-encoder";
import type { CoinType } from "enssdk";

/**
 * address-encoder coin names for ENSIP-19 primary-name chains, paired with their canonical
 * GraphQL `ENSIP19Chain` enum values.
 */
export const ENSIP19_COIN_NAMES = [
  ["default", "DEFAULT"],
  ["eth", "ETHEREUM"],
  ["base", "BASE"],
  ["op", "OPTIMISM"],
  ["arb1", "ARBITRUM"],
  ["linea", "LINEA"],
  ["scr", "SCROLL"],
] as const satisfies readonly (readonly [CoinName, string])[];

export type ENSIP19CoinName = (typeof ENSIP19_COIN_NAMES)[number][0];
export type ENSIP19ChainValue = (typeof ENSIP19_COIN_NAMES)[number][1];

export const ENSIP19_CHAIN_VALUES = ENSIP19_COIN_NAMES.map(
  ([, chain]) => chain,
) as unknown as readonly [ENSIP19ChainValue, ...ENSIP19ChainValue[]];

/** Canonical ENSIP-9 coin types for ENSIP-19 primary-name chains. */
export const ENSIP19_COIN_TYPES = ENSIP19_COIN_NAMES.map(
  ([coinName]) => coinNameToTypeMap[coinName] as CoinType,
);

const ensip19ChainToCoinName = Object.fromEntries(
  ENSIP19_COIN_NAMES.map(([coinName, chain]) => [chain, coinName]),
) as Record<ENSIP19ChainValue, ENSIP19CoinName>;

/** Maps an `ENSIP19Chain` enum value to its canonical ENSIP-9 coin type. */
export const ensip19ChainToCoinType = (chain: ENSIP19ChainValue): CoinType =>
  coinNameToTypeMap[ensip19ChainToCoinName[chain]] as CoinType;

/** Maps a coin type to an `ENSIP19Chain` enum value, or null when not ENSIP-19 supported. */
export const coinTypeToEnsip19Chain = (coinType: CoinType): ENSIP19ChainValue | null => {
  const entry = ENSIP19_COIN_NAMES.find(([coinName]) => coinNameToTypeMap[coinName] === coinType);
  if (!entry) return null;
  return entry[1];
};
