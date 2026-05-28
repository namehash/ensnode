import type { CoinType } from "enssdk";

import {
  coinTypeToEnsip19Chain,
  type ENSIP19ChainValue,
  ensip19ChainToCoinType,
} from "@/omnigraph-api/lib/resolution/chain-coin-type";

export type PrimaryNameByInput = {
  coinType?: CoinType | null;
  chain?: ENSIP19ChainValue | null;
};

export type AccountPrimaryNamesWhereInput = {
  coinTypes?: CoinType[] | null;
  chains?: ENSIP19ChainValue[] | null;
};

/** Normalizes a singular `PrimaryNameByInput` to a coin type. */
export const normalizePrimaryNameByInput = (by: PrimaryNameByInput): CoinType => {
  if (by.coinType != null) return by.coinType;
  if (by.chain != null) return ensip19ChainToCoinType(by.chain);
  throw new Error("PrimaryNameByInput must specify exactly one of coinType or chain.");
};

/** Normalizes `AccountPrimaryNamesWhereInput` to an ordered coin-type list. */
export const normalizeAccountPrimaryNamesWhereInput = (
  where: AccountPrimaryNamesWhereInput,
): CoinType[] => {
  if (where.coinTypes != null) return where.coinTypes;
  if (where.chains != null) return where.chains.map(ensip19ChainToCoinType);
  throw new Error("AccountPrimaryNamesWhereInput must specify exactly one of coinTypes or chains.");
};

/** Projects a coin type to its ENSIP19Chain enum value, if applicable. */
export const projectCoinTypeToEnsip19Chain = (coinType: CoinType): ENSIP19ChainValue | null =>
  coinTypeToEnsip19Chain(coinType);
