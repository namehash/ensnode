import {
  DatasourceNames,
  type ENSNamespaceId,
  ENSNamespaceIds,
  maybeGetDatasource,
} from "@ensnode/datasources";
import {
  CoinType,
  ETH_COIN_TYPE,
  evmChainIdToCoinType,
  ResolverRecordsSelection,
  uniq,
} from "@ensnode/ensnode-sdk";

const getENSIP19SupportedCoinTypes = (namespace: ENSNamespaceId) =>
  uniq(
    [
      maybeGetDatasource(namespace, DatasourceNames.ReverseResolverBase),
      maybeGetDatasource(namespace, DatasourceNames.ReverseResolverLinea),
      maybeGetDatasource(namespace, DatasourceNames.ReverseResolverOptimism),
      maybeGetDatasource(namespace, DatasourceNames.ReverseResolverArbitrum),
      maybeGetDatasource(namespace, DatasourceNames.ReverseResolverScroll),
    ]
      .filter((ds) => ds !== undefined)
      .map((ds) => ds.chain.id),
  ).map(evmChainIdToCoinType);

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
  [ENSNamespaceIds.Holesky]: {
    addresses: getCommonCoinTypes(ENSNamespaceIds.Holesky),
    texts: TEXTS,
  },
  [ENSNamespaceIds.EnsTestEnv]: {
    addresses: getCommonCoinTypes(ENSNamespaceIds.EnsTestEnv),
    texts: TEXTS,
  },
} as const satisfies Record<ENSNamespaceId, ResolverRecordsSelection>;
