import {
  DatasourceNames,
  ENSNamespaceId,
  ENSNamespaceIds,
  maybeGetDatasource,
} from "@ensnode/datasources";
import { ETH_COIN_TYPE, evmChainIdToCoinType } from "../ens";
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

const TEXTS = [
  "url",
  "avatar",
  "header",
  "description",
  "email",
  "com.twitter",
  "com.farcaster",
  "com.github",
  "org.telegram",
  "com.linkedin",
  "com.reddit",
] as const satisfies string[];

export const DefaultRecordsSelection = {
  [ENSNamespaceIds.Mainnet]: {
    addresses: [ETH_COIN_TYPE, ...getENSIP19SupportedCoinTypes(ENSNamespaceIds.Mainnet)],
    texts: TEXTS,
  },
  [ENSNamespaceIds.Sepolia]: {
    addresses: [ETH_COIN_TYPE, ...getENSIP19SupportedCoinTypes(ENSNamespaceIds.Sepolia)],
    texts: TEXTS,
  },
  [ENSNamespaceIds.Holesky]: {
    addresses: [ETH_COIN_TYPE, ...getENSIP19SupportedCoinTypes(ENSNamespaceIds.Holesky)],
    texts: TEXTS,
  },
  [ENSNamespaceIds.EnsTestEnv]: {
    addresses: [ETH_COIN_TYPE, ...getENSIP19SupportedCoinTypes(ENSNamespaceIds.EnsTestEnv)],
    texts: TEXTS,
  },
} as const satisfies Record<ENSNamespaceId, ResolverRecordsSelection>;
