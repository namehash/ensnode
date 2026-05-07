import type { CoinType } from "enssdk";
import { ETH_COIN_TYPE, evmChainIdToCoinType } from "enssdk";

import { type ENSNamespaceId, ENSNamespaceIds } from "@ensnode/datasources";
import type { ResolverRecordsSelection } from "@ensnode/ensnode-sdk";

import { getENSIP19SupportedChainIds } from "@/lib/get-ensip19-supported-chain-ids";

const getENSIP19SupportedCoinTypes = (namespace: ENSNamespaceId) =>
  getENSIP19SupportedChainIds(namespace).map(evmChainIdToCoinType);

export const getCommonCoinTypes = (namespace: ENSNamespaceId): CoinType[] => {
  return [ETH_COIN_TYPE, ...getENSIP19SupportedCoinTypes(namespace)];
};

const TEXTS = [
  "url",
  "avatar",
  "header",
  "description",
  "email",
  "com.twitter",
  "com.farcaster",
  "com.github",
] as const satisfies string[];

/**
 * Defines a set of 'default' records to query when making Protocol Inspector requests.
 */
export const DefaultRecordsSelection = {
  [ENSNamespaceIds.Mainnet]: {
    addresses: getCommonCoinTypes(ENSNamespaceIds.Mainnet),
    texts: TEXTS,
  },
  [ENSNamespaceIds.Sepolia]: {
    addresses: getCommonCoinTypes(ENSNamespaceIds.Sepolia),
    texts: TEXTS,
  },
  [ENSNamespaceIds.SepoliaV2]: {
    addresses: getCommonCoinTypes(ENSNamespaceIds.SepoliaV2),
    texts: TEXTS,
  },
  [ENSNamespaceIds.EnsTestEnv]: {
    addresses: getCommonCoinTypes(ENSNamespaceIds.EnsTestEnv),
    texts: TEXTS,
  },
} as const satisfies Record<ENSNamespaceId, ResolverRecordsSelection>;
