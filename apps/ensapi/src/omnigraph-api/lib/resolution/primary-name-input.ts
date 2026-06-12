import type { CoinType } from "enssdk";

import { chainNameToCoinType } from "@/omnigraph-api/lib/resolution/chain-coin-type";
import type {
  PrimaryNameByInputValue,
  PrimaryNamesWhereInputValue,
} from "@/omnigraph-api/schema/resolution";

/**
 * Normalizes a singular `PrimaryNameByInput` to a coin type.
 */
export const normalizePrimaryNameByInput = (by: PrimaryNameByInputValue): CoinType => {
  if (by.coinType != null) return by.coinType;
  if (by.chainName != null) return chainNameToCoinType(by.chainName);
  // this should never happen as the schema with `@oneOf` prevents it
  throw new Error("PrimaryNameByInput must specify exactly one of coinType or chainName.");
};

/**
 * Normalizes `PrimaryNamesWhereInput` to an ordered coin-type list.
 */
export const normalizeAccountPrimaryNamesWhereInput = (
  where: PrimaryNamesWhereInputValue,
): CoinType[] => {
  if (where.coinTypes != null) return where.coinTypes;
  if (where.chainNames != null) return where.chainNames.map(chainNameToCoinType);
  // this should never happen as the schema with `@oneOf` prevents it
  throw new Error("PrimaryNamesWhereInput must specify exactly one of coinTypes or chainNames.");
};
