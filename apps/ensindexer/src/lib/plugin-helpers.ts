import type { ENSIndexerConfig } from "@/config/types";
import { uniq } from "@/lib/lib-helpers";
import { DatasourceName, ENSNamespaceId, getENSNamespace } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import { createConfig as createPonderConfig } from "ponder";

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
 * ENSNamespaceFullyDefinedAtCompileTime is a helper type necessary to support runtime-conditional
 * Ponder plugins.
 *
 * 1. ENSNode can be configured to index in the context of different ENS namespaces,
 *   (currently: mainnet, sepolia, holesky, ens-test-env), using a user-specified set of plugins.
 * 2. Ponder's inferred type-checking requires const-typed values, and so those plugins must be able
 *   to define their Ponder config statically so the types can be inferred at compile-time, regardless
 *   of whether the plugin's config and handler logic is loaded/executed at runtime.
 * 3. To make this work, we provide a ENSNamespaceFullyDefinedAtCompileTime, set to the typeof mainnet's
 *   ENSNamespace, which fully defines all known Datasources (if this is ever not the case, a merged
 *   type can be used to ensure that this type has the full set of possible Datasources). Plugins
 *   can use the runtime value returned from {@link getENSNamespaceAsFullyDefinedAtCompileTime} and
 *   by casting it to ENSNamespaceFullyDefinedAtCompileTime we ensure that the values expected by
 *   those plugins pass the typechecker. ENSNode ensures that non-active plugins are not executed,
 *   so the issue of type/value mismatch does not occur during execution.
 */
type ENSNamespaceFullyDefinedAtCompileTime = ReturnType<typeof getENSNamespace<"mainnet">>;

/**
 * Returns the ENSNamespace for the provided `namespaceId`, cast to ENSNamespaceFullyDefinedAtCompileTime.
 *
 * See {@link ENSNamespaceFullyDefinedAtCompileTime} for more info.
 *
 * @param namespaceId - The ENS namespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @returns the ENSNamespace
 */
export const getENSNamespaceAsFullyDefinedAtCompileTime = (namespaceId: ENSNamespaceId) =>
  getENSNamespace(namespaceId) as ENSNamespaceFullyDefinedAtCompileTime;

/**
 * Returns the `datasourceName` Datasource within the `namespaceId` namespace, cast as ENSNamespaceFullyDefinedAtCompileTime.
 *
 * NOTE: the typescript typechecker will _not_ enforce validity. i.e. using an invalid `datasourceName`
 * within the specified `namespaceId` will have a valid return type but be undefined at runtime.
 */
export const getDatasourceAsFullyDefinedAtCompileTime = <
  N extends ENSNamespaceId,
  D extends keyof ENSNamespaceFullyDefinedAtCompileTime,
>(
  namespaceId: N,
  datasourceName: D,
) => getENSNamespaceAsFullyDefinedAtCompileTime(namespaceId)[datasourceName];

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
