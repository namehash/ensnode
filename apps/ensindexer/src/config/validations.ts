import { isNormalizedAddress } from "enssdk";

import { type DatasourceName, type ENSNamespace, getENSNamespace } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
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

// Invariant: each END_BLOCK_<chainId> targets a chain that is actually indexed
export function invariant_chainEndBlocks(
  ctx: ZodCheckFnInput<Pick<EnsIndexerConfig, "chainEndBlocks" | "indexedChainIds">>,
) {
  const { value: config } = ctx;

  for (const chainId of config.chainEndBlocks.keys()) {
    if (!config.indexedChainIds.has(chainId)) {
      ctx.issues.push({
        code: "custom",
        input: config,
        message: `END_BLOCK_${chainId} is set, but no active plugin indexes chain ${chainId}.`,
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
      // only ContractConfigs with `address` defined
      if ("address" in contractConfig && typeof contractConfig.address === "string") {
        if (!isNormalizedAddress(contractConfig.address)) {
          throw new Error(
            `The '${config.namespace}' namespace's '${datasourceName}' Datasource does not define a valid address for ${contractName}: '${contractConfig.address}'. This occurs if the address property of any ContractConfig in the Datasource is malformed (i.e. not an enssdk#NormalizedAddress). This is only likely to occur if you are actively editing the Datasource and typo'd an address.`,
          );
        }
      }
    }
  }
}

// Invariant: unigraph plugin requires protocol acceleration
export function invariant_unigraphRequiresProtocolAcceleration(
  ctx: ZodCheckFnInput<Pick<EnsIndexerConfig, "plugins">>,
) {
  const { value: config } = ctx;

  if (
    config.plugins.includes(PluginName.Unigraph) &&
    !config.plugins.includes(PluginName.ProtocolAcceleration)
  ) {
    throw new Error(
      `The '${PluginName.Unigraph}' plugin depends on the inclusion of '${PluginName.ProtocolAcceleration}' plugin.`,
    );
  }
}

// Invariant: efp plugin requires unigraph
export function invariant_efpRequiresUnigraph(
  ctx: ZodCheckFnInput<Pick<EnsIndexerConfig, "plugins">>,
) {
  const { value: config } = ctx;

  if (config.plugins.includes(PluginName.EFP) && !config.plugins.includes(PluginName.Unigraph)) {
    throw new Error(
      `The '${PluginName.EFP}' plugin depends on the inclusion of '${PluginName.Unigraph}' plugin.`,
    );
  }
}
