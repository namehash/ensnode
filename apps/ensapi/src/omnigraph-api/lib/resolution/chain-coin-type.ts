import type { CoinName } from "@ensdomains/address-encoder";
import { coinNameToTypeMap } from "@ensdomains/address-encoder";
import type { CoinType } from "enssdk";

/**
 * address-encoder coin names for ENSIP-19 primary-name chains.
 */
export const ENSIP19_COIN_NAMES = [
  "default",
  "eth",
  "base",
  "op",
  "arb1",
  "linea",
  "scr",
] as const satisfies readonly CoinName[];

/** Canonical ENSIP-9 coin types for ENSIP-19 primary-name chains. */
export const ENSIP19_COIN_TYPES = ENSIP19_COIN_NAMES.map(
  (name) => coinNameToTypeMap[name] as CoinType,
);

export type ENSIP19ChainValue = Uppercase<(typeof ENSIP19_COIN_NAMES)[number]>;

export const ENSIP19_CHAIN_VALUES = ENSIP19_COIN_NAMES.map((coinName) =>
  coinName.toUpperCase(),
) as unknown as readonly [ENSIP19ChainValue, ...ENSIP19ChainValue[]];

const ensip19ChainToCoinName = Object.fromEntries(
  ENSIP19_CHAIN_VALUES.map((chain) => [
    chain,
    chain.toLowerCase() as (typeof ENSIP19_COIN_NAMES)[number],
  ]),
) as Record<ENSIP19ChainValue, (typeof ENSIP19_COIN_NAMES)[number]>;

/** Maps an `ENSIP19Chain` enum value to its canonical ENSIP-9 coin type. */
export const ensip19ChainToCoinType = (chain: ENSIP19ChainValue): CoinType =>
  coinNameToTypeMap[ensip19ChainToCoinName[chain]] as CoinType;

/** Maps a coin type to an `ENSIP19Chain` enum value, or null when not ENSIP-19 supported. */
export const coinTypeToEnsip19Chain = (coinType: CoinType): ENSIP19ChainValue | null => {
  const coinName = ENSIP19_COIN_NAMES.find((name) => coinNameToTypeMap[name] === coinType);
  if (!coinName) return null;
  return coinName.toUpperCase() as ENSIP19ChainValue;
};
