import { z } from "zod/v4";

import type { ENSIndexerConfig } from "@/config/types";
import { uniq } from "@/lib/lib-helpers";
import { getPlugin } from "@/plugins";
import { DatasourceName, getCommonDatasources } from "@ensnode/datasources";
import { Address, isAddress } from "viem";

// type alias to highlight the input param of Zod's check() method
type ZodCheckFnInput<T> = z.core.ParsePayload<T>;

// Invariant: specified plugins' datasources are available in the specified l1Chain's Datasources
export function invariant_requiredDatasources(
  ctx: ZodCheckFnInput<Pick<ENSIndexerConfig, "l1Chain" | "plugins">>,
) {
  const { value: config } = ctx;

  const datasources = getCommonDatasources(config.l1Chain);
  const availableDatasourceNames = Object.keys(datasources) as DatasourceName[];
  const activePluginNames = config.plugins;

  // validate that each active plugin's requiredDatasources are available in availableDatasourceNames
  for (const pluginName of activePluginNames) {
    const { requiredDatasources } = getPlugin(pluginName);
    const hasRequiredDatasources = requiredDatasources.every((datasourceName) =>
      availableDatasourceNames.includes(datasourceName),
    );

    if (!hasRequiredDatasources) {
      ctx.issues.push({
        code: "custom",
        input: config,
        message: `Requested plugin '${pluginName}' cannot be activated for the ${
          config.l1Chain
        } ENS namespace. ${pluginName} specifies dependent datasources: [${requiredDatasources.join(
          ", ",
        )}], but available datasources in the ${
          config.l1Chain
        } ENS namespace are: [${availableDatasourceNames.join(", ")}].`,
      });
    }
  }
}

// Invariant: rpcConfig is specified for each indexed chain
export function invariant_rpcConfigsSpecifiedForIndexedChains(
  ctx: ZodCheckFnInput<Pick<ENSIndexerConfig, "l1Chain" | "plugins" | "rpcConfigs">>,
) {
  const { value: config } = ctx;

  const datasources = getCommonDatasources(config.l1Chain);

  for (const pluginName of config.plugins) {
    const datasourceNames = getPlugin(pluginName).requiredDatasources;

    for (const datasourceName of datasourceNames) {
      const { chain } = datasources[datasourceName];

      if (!config.rpcConfigs[chain.id]) {
        ctx.issues.push({
          code: "custom",
          input: config,
          message: `Plugin '${pluginName}' indexes chain with id ${chain.id} but RPC_URL_${chain.id} is not specified.`,
        });
      }
    }
  }
}

// Invariant: if a global blockrange is defined, only one network is indexed
export function invariant_globalBlockrange(
  ctx: ZodCheckFnInput<Pick<ENSIndexerConfig, "globalBlockrange" | "l1Chain" | "plugins">>,
) {
  const { value: config } = ctx;
  const { globalBlockrange } = config;

  if (globalBlockrange.startBlock !== undefined || globalBlockrange.endBlock !== undefined) {
    const datasources = getCommonDatasources(config.l1Chain);
    const indexedChainIds = uniq(
      config.plugins
        .flatMap((pluginName) => getPlugin(pluginName).requiredDatasources)
        .map((datasourceName) => datasources[datasourceName])
        .map((datasource) => datasource.chain.id),
    );

    if (indexedChainIds.length > 1) {
      ctx.issues.push({
        code: "custom",
        input: config,
        message: `ENSIndexer's behavior when indexing _multiple networks_ with a _specific blockrange_ is considered undefined (for now). If you're using this feature, you're likely interested in snapshotting at a specific END_BLOCK, and may have unintentially activated plugins that source events from multiple chains. The config currently is:

  L1_CHAIN=${config.l1Chain}
  ACTIVE_PLUGINS=${config.plugins.join(",")}
  START_BLOCK=${globalBlockrange.startBlock || "n/a"}
  END_BLOCK=${globalBlockrange.endBlock || "n/a"}

  The usage you're most likely interested in is:
    L1_CHAIN=(mainnet|sepolia|holesky) ACTIVE_PLUGINS=subgraph END_BLOCK=x pnpm run start
  which runs just the 'subgraph' plugin with a specific end block, suitable for snapshotting ENSNode and comparing to Subgraph snapshots.

  In the future, indexing multiple networks with network-specific blockrange constraints may be possible.`,
      });
    }
  }
}

// Invariant: all contracts have a valid ContractConfig defined
export function invariant_validContractConfigs(
  ctx: ZodCheckFnInput<Pick<ENSIndexerConfig, "l1Chain">>,
) {
  const { value: config } = ctx;

  const datasources = getCommonDatasources(config.l1Chain);
  for (const datasourceName of Object.keys(datasources) as DatasourceName[]) {
    const { contracts } = datasources[datasourceName];

    // invariant: `contracts` must provide valid addresses if a filter is not provided
    const hasAddresses = Object.values(contracts)
      .filter((contractConfig) => "address" in contractConfig) // only ContractConfigs with `address` defined
      .every((contractConfig) => isAddress(contractConfig.address as Address)); // must be a valid `Address`

    if (!hasAddresses) {
      throw new Error(
        `The '${
          config.l1Chain
        }' ENS namespace's '${datasourceName}' Datasource does not define valid addresses. This occurs if the address property of any ContractConfig in the Datasource is malformed (i.e. not a viem#Address). This is only likely to occur if you are attempting to index the 'ens-test-env' ENS namespace outside of the context of the ens-test-env tool (https://github.com/ensdomains/ens-test-env). If you are activating the ens-test-env plugin and receive this error, NEXT_PUBLIC_DEPLOYMENT_ADDRESSES or DEPLOYMENT_ADDRESSES is not available in the env or is malformed.

L1_CHAIN=${config.l1Chain}
NEXT_PUBLIC_DEPLOYMENT_ADDRESSES=${process.env.NEXT_PUBLIC_DEPLOYMENT_ADDRESSES || "undefined"}
DEPLOYMENT_ADDRESSES=${process.env.DEPLOYMENT_ADDRESSES || "undefined"}`,
      );
    }
  }
}
