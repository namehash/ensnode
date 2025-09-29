import { constrainBlockrange } from "@/lib/ponder-helpers";
import { Blockrange } from "@/lib/types";
import {
  DatasourceName,
  ENSNamespaceId,
  ResolverABI,
  ResolverFilter,
  maybeGetDatasource,
} from "@ensnode/datasources";
import { ContractConfig } from "ponder";

/**
 * Creates a ponder#ContractConfig that describes all Resolver contracts on chains included in the
 * set of `datasourceNames` in `namespace`, constrained by `globalBlockrange`.
 */
export function resolverContractConfig(
  namespace: ENSNamespaceId,
  datasourceNames: DatasourceName[],
  globalBlockrange: Blockrange,
) {
  return {
    abi: ResolverABI,
    chain: datasourceNames
      .map((datasourceName) => maybeGetDatasource(namespace, datasourceName))
      .filter((datasource) => !!datasource)
      .reduce(
        (memo, datasource) => ({
          ...memo,
          [datasource.chain.id.toString()]: {
            filter: ResolverFilter,
            ...constrainBlockrange(
              globalBlockrange,
              // NOTE: all of the relevant datasources provide a Resolver ContractConfig with a `startBlock`
              datasource.contracts.Resolver?.startBlock ?? 0,
            ),
          },
        }),
        {},
      ),
  } satisfies ContractConfig;
}
