import { type Address, isAddress } from "viem";

import { type DatasourceName, type ENSNamespace, getENSNamespace } from "@ensnode/datasources";
import { asLowerCaseAddress, PluginName } from "@ensnode/ensnode-sdk";
import type { ZodCheckFnInput } from "@ensnode/ensnode-sdk/internal";

import { getPlugin } from "@/plugins";

import type { EnsIndexerConfig } from "./types";

// Invariant: each plugin's requiredDatasourceNames is a subset of its allDatasourceNames
export function invariant_requiredDatasourcesSubsetOfAll(
  ctx: ZodCheckFnInput<Pick<EnsIndexerConfig, "plugins">>,
) {
  const { value: config } = ctx;

  for (const pluginName of config.plugins) {
    const plugin = getPlugin(pluginName);
    const allSet = new Set(plugin.allDatasourceNames);
    const missing = plugin.requiredDatasourceNames.filter((name) => !allSet.has(name));

    if (missing.length > 0) {
      ctx.issues.push({
        code: "custom",
        input: config,
        message: `Plugin '${pluginName}' has requiredDatasourceNames [${missing.join(", ")}] that are not included in its allDatasourceNames.`,
      });
    }
  }
}

// Invariant: specified plugins' datasources are available in the specified namespace's Datasources
export function invariant_requiredDatasources(
  ctx: ZodCheckFnInput<Pick<EnsIndexerConfig, "namespace" | "plugins">>,
) {
  const { value: config } = ctx;

  const datasources = getENSNamespace(config.namespace);
  const availableDatasourceNames = Object.keys(datasources) as DatasourceName[];

  // validate that each active plugin's requiredDatasources are available in availableDatasourceNames
  for (const pluginName of config.plugins) {
    const { requiredDatasourceNames } = getPlugin(pluginName);
    const hasRequiredDatasources = requiredDatasourceNames.every((datasourceName) =>
      availableDatasourceNames.includes(datasourceName),
    );

    if (!hasRequiredDatasources) {
      ctx.issues.push({
        code: "custom",
        input: config,
        message: `Requested plugin '${pluginName}' cannot be activated for the ${
          config.namespace
        } ENS namespace. ${pluginName} specifies dependent datasources: [${requiredDatasourceNames.join(
          ", ",
        )}], but available datasources in the ${
          config.namespace
        } namespace are: [${availableDatasourceNames.join(", ")}].`,
      });
    }
  }
}

// Invariant: rpcConfig is specified for each indexed chain
export function invariant_rpcConfigsSpecifiedForIndexedChains(
  ctx: ZodCheckFnInput<Pick<EnsIndexerConfig, "indexedChainIds" | "rpcConfigs">>,
) {
  const { value: config } = ctx;

  for (const chainId of config.indexedChainIds) {
    if (!config.rpcConfigs.has(chainId)) {
      ctx.issues.push({
        code: "custom",
        input: config,
        message: `An active plugin indexes chain ${chainId}, but RPC_URL_${chainId} is not configured.`,
      });
    }
  }
}

// Invariant: if a global blockrange is defined, only one chain is indexed
export function invariant_globalBlockrange(
  ctx: ZodCheckFnInput<
    Pick<EnsIndexerConfig, "globalBlockrange" | "indexedChainIds" | "namespace" | "plugins">
  >,
) {
  const { value: config } = ctx;
  const { globalBlockrange } = config;

  if (globalBlockrange.startBlock !== undefined || globalBlockrange.endBlock !== undefined) {
    if (config.indexedChainIds.size > 1) {
      ctx.issues.push({
        code: "custom",
        input: config,
        message: `ENSIndexer's behavior when indexing _multiple chains_ with a _specific blockrange_ is considered undefined (for now). If you're using this feature, you're likely interested in snapshotting at a specific END_BLOCK, and may have unintentially activated plugins that source events from multiple chains. The config currently is:

  NAMESPACE=${config.namespace}
  PLUGINS=${config.plugins.join(",")}
  START_BLOCK=${globalBlockrange.startBlock || "n/a"}
  END_BLOCK=${globalBlockrange.endBlock || "n/a"}

  The usage you're most likely interested in is:
    NAMESPACE=(mainnet|sepolia) PLUGINS=subgraph END_BLOCK=x pnpm run start
  which runs just the 'subgraph' plugin with a specific end block, suitable for snapshotting ENSNode and comparing to Subgraph snapshots.

  In the future, indexing multiple chains with chain-specific blockrange constraints may be possible.`,
      });
    }
  }
}

// Invariant: all contracts have a valid ContractConfig defined
export function invariant_validContractConfigs(
  ctx: ZodCheckFnInput<Pick<EnsIndexerConfig, "namespace">>,
) {
  const { value: config } = ctx;

  const datasources = getENSNamespace(config.namespace) as ENSNamespace;
  const datasourceNames = Object.keys(datasources) as DatasourceName[];
  for (const datasourceName of datasourceNames) {
    const datasource = datasources[datasourceName];
    if (!datasource) continue; // ignore undefined datasources, caught by requiredDatasources invariant

    // Invariant: `contracts` must provide valid addresses if a filter is not provided
    for (const [contractName, contractConfig] of Object.entries(datasource.contracts)) {
      if ("address" in contractConfig && typeof contractConfig.address === "string") {
        // only ContractConfigs with `address` defined
        const isValidAddress =
          isAddress(contractConfig.address as Address, { strict: false }) && // must be a valid `Address`
          contractConfig.address === asLowerCaseAddress(contractConfig.address); // and in lowercase format

        if (!isValidAddress) {
          throw new Error(
            `The '${config.namespace}' namespace's '${datasourceName}' Datasource does not define a valid address for ${contractName}: '${contractConfig.address}'. This occurs if the address property of any ContractConfig in the Datasource is malformed (i.e. not a lowercase viem#Address). This is only likely to occur if you are actively editing the Datasource and typo'd an address.`,
          );
        }
      }
    }
  }
}

// Invariant: ensv2 plugin requires protocol acceleration
export function invariant_ensv2RequiresProtocolAcceleration(
  ctx: ZodCheckFnInput<Pick<EnsIndexerConfig, "plugins">>,
) {
  const { value: config } = ctx;

  if (
    config.plugins.includes(PluginName.ENSv2) &&
    !config.plugins.includes(PluginName.ProtocolAcceleration)
  ) {
    throw new Error(
      `The '${PluginName.ENSv2}' plugin depends on the inclusion of '${PluginName.ProtocolAcceleration}' plugin.`,
    );
  }
}
