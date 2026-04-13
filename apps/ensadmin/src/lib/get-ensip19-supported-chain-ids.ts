import type { ChainId } from "enssdk";

import { DatasourceNames, type ENSNamespaceId, maybeGetDatasource } from "@ensnode/datasources";
import { uniq } from "@ensnode/ensnode-sdk";

/**
 * Returns the unique set of chain IDs that support ENSIP-19 reverse resolution
 * for the given namespace.
 */
export const getENSIP19SupportedChainIds = (namespace: ENSNamespaceId): ChainId[] =>
  uniq(
    [
      maybeGetDatasource(namespace, DatasourceNames.ReverseResolverBase),
      maybeGetDatasource(namespace, DatasourceNames.ReverseResolverLinea),
      maybeGetDatasource(namespace, DatasourceNames.ReverseResolverOptimism),
      maybeGetDatasource(namespace, DatasourceNames.ReverseResolverArbitrum),
      maybeGetDatasource(namespace, DatasourceNames.ReverseResolverScroll),
    ].flatMap((ds) => (ds ? [ds.chain.id] : [])),
  );
