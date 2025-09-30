import { constrainBlockrange } from "@/lib/ponder-helpers";
import { Blockrange } from "@/lib/types";
import {
  DatasourceName,
  ENSNamespaceId,
  ResolverABI,
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
      .filter((datasource) => {
        // all of the relevant datasources provide a Resolver ContractConfig with a `startBlock`
        if (!datasource.contracts.Resolver) {
          console.warn(
            `Warning(resolverContractConfig): Datasource does not define a 'Resolver' contract. ${JSON.stringify(datasource)}`,
          );
          return false;
        }

        return true;
      })
      .reduce(
        (memo, datasource) => ({
          ...memo,
          [datasource.chain.id.toString()]: {
            ...constrainBlockrange(
              globalBlockrange,
              // NOTE: ! ok due to .filter above
              datasource.contracts.Resolver!.startBlock ?? 0,
            ),
          },
        }),
        {},
      ),
  } satisfies ContractConfig;
}
