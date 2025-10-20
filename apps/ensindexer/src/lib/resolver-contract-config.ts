import { constrainBlockrange } from "@/lib/ponder-helpers";
import {
  DatasourceName,
  ENSNamespaceId,
  ResolverABI,
  maybeGetDatasource,
} from "@ensnode/datasources";
import type { Blockrange } from "@ensnode/ensnode-sdk";
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
          [datasource.chain.id.toString()]: constrainBlockrange(
            globalBlockrange,
            datasource.contracts.Resolver!, // ! ok due to above,
          ),
        }),
        {},
      ),
  } satisfies ContractConfig;
}
