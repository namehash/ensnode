import {
  DatasourceNames,
  ENSNamespaceId,
  ENSNamespaceIds,
  maybeGetDatasource,
} from "@ensnode/datasources";
import { CoinType, ETH_COIN_TYPE, evmChainIdToCoinType } from "../ens";
import { uniq } from "../shared";
import type { ResolverRecordsSelection } from "./resolver-records-selection";

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

// TODO: Phase out this concept. All apps should define their own selection of records.
// Additionally, we should update `useRecords` so that it can return not only all the
// (texts / addresses) records that are explicitly requested, but also any other (texts / addresses)
// records that ENSNode has found onchain.
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
