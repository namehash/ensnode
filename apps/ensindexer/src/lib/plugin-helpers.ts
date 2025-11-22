import type { createConfig as createPonderConfig } from "ponder";

import type { DatasourceName } from "@ensnode/datasources";
import { PluginName, uniq } from "@ensnode/ensnode-sdk";

import type { ENSIndexerConfig } from "@/config/types";

/**
 * Creates a namespaced contract name for Ponder handlers.
 *
 * Ponder config requires a flat dictionary of contract config entires, where each entry has its
 * unique name and set of EVM event names derived from the contract's ABI. Ponder will use contract
 * names and their respective event names to create names for indexing handlers. For example, a contract
 * named  `Registry` includes events: `NewResolver` and `NewTTL`. Ponder will create indexing handlers
 * named `Registry:NewResolver` and `Registry:NewTTL`.
 *
 * However, because plugins within ENSIndexer may use the same contract/event names, an additional
 * namespace prefix is required to distinguish between contracts having the same name, with different
 * implementations.
 *
 * NOTE: uses const generic typing for const inference at compile-time, necessry for ponder's
 * inferred handler typings.
 *
 * @example
 * ```ts
 * namespaceContract(PluginName.Subgraph, "Registry"); // returns "subgraph/Registry"
 * namespaceContract(PluginName.Basenames, "Registry"); // returns "basenames/Registry");
 * ```
 *
 */
export function namespaceContract<const PREFIX extends string, const CONTRACT_NAME extends string>(
  prefix: PREFIX,
  contractName: CONTRACT_NAME,
): `${PREFIX}/${CONTRACT_NAME}` {
  if (/[.:]/.test(prefix)) {
    throw new Error("Reserved character: Contract namespace prefix cannot contain '.' or ':'");
  }

  return `${prefix}/${contractName}` as const;
}

/**
 * Describes an ENSIndexerPlugin used within the ENSIndexer project.
 *
 * NOTE: uses generic typings to capture inferred const types for inference.
 */
export interface ENSIndexerPlugin<
  PLUGIN_NAME extends PluginName = PluginName,
  REQUIRED_DATASOURCE_NAMES extends readonly DatasourceName[] = DatasourceName[],
  CHAINS extends object = {},
  CONTRACTS extends object = {},
  ACCOUNTS extends object = {},
  BLOCKS extends object = {},
> {
  /**
   * The plugin's unique name.
   */
  name: PLUGIN_NAME;

  /**
   * The list of DatasourceNames this plugin requires access to. ENSIndexer enforces that a plugin
   * can only be activated if all of its required Datasources are defined on the configured ENS Namespace.
   */
  requiredDatasourceNames: REQUIRED_DATASOURCE_NAMES;

  /**
   * Create Ponder Config for the plugin.
   *
   * @param {ENSIndexerConfig} config
   */
  createPonderConfig(
    config: ENSIndexerConfig,
  ): PonderConfigResult<CHAINS, CONTRACTS, ACCOUNTS, BLOCKS>;
}

/**
 * Helper type to capture the return type of `createPonderConfig` with its `const` inferred generics.
 */
type PonderConfigResult<
  CHAINS extends object = {},
  CONTRACTS extends object = {},
  ACCOUNTS extends object = {},
  BLOCKS extends object = {},
> = ReturnType<typeof createPonderConfig<CHAINS, CONTRACTS, ACCOUNTS, BLOCKS>>;

/**
 * Options type for `buildPlugin` function input.
 *
 * NOTE: uses generic typings to capture inferred const types for inference.
 */
export interface BuildPluginOptions<
  PLUGIN_NAME extends PluginName,
  REQUIRED_DATASOURCE_NAMES extends readonly DatasourceName[],
  PONDER_CONFIG_RESULT extends PonderConfigResult,
> {
  /** The unique plugin name */
  name: PLUGIN_NAME;

  /** The plugin's required Datasources */
  requiredDatasourceNames: REQUIRED_DATASOURCE_NAMES;

  /**
   * Create the ponder configuration lazily to prevent premature execution of
   * nested factory functions, i.e. to ensure that the ponder configuration
   * is only created for this plugin when it is activated.
   */
  createPonderConfig(config: ENSIndexerConfig): PONDER_CONFIG_RESULT;
}

/**
 * Creates an ENSIndexerPlugin for ENSIndexer. Is a simple factory for the provided `options`
 * but enforces type correctness of `options` and captures inferred const types for inference.
 */
export function createPlugin<
  PLUGIN_NAME extends PluginName,
  REQUIRED_DATASOURCE_NAMES extends readonly DatasourceName[],
  PONDER_CONFIG_RESULT extends PonderConfigResult,
>(
  options: BuildPluginOptions<PLUGIN_NAME, REQUIRED_DATASOURCE_NAMES, PONDER_CONFIG_RESULT>,
): ENSIndexerPlugin<
  PLUGIN_NAME,
  REQUIRED_DATASOURCE_NAMES,
  PONDER_CONFIG_RESULT["chains"],
  PONDER_CONFIG_RESULT["contracts"],
  PONDER_CONFIG_RESULT["accounts"],
  PONDER_CONFIG_RESULT["blocks"]
> {
  return options;
}

export function getRequiredDatasourceNames(plugins: ENSIndexerPlugin[]): DatasourceName[] {
  const requiredDatasourceNames = plugins.flatMap((plugin) => plugin.requiredDatasourceNames);

  return uniq(requiredDatasourceNames);
}

/**
 * Determines whether a plugin supports 'preminted' names. See `apps/ensindexer/src/handlers/Registrar.ts`
 * for further discussion.
 */
export const pluginSupportsPremintedNames = (pluginName: PluginName) =>
  [PluginName.Basenames, PluginName.Lineanames].includes(pluginName);
