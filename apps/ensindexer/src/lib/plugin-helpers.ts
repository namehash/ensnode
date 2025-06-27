import type { ENSIndexerConfig } from "@/config/types";
import { uniq } from "@/lib/lib-helpers";
import { DatasourceName, ENSNamespaceId, getENSNamespace } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import { createConfig as createPonderConfig } from "ponder";

/**
 * A factory function that returns a function to create a namespaced contract name for Ponder handlers.
 *
 * Ponder config requires a flat dictionary of contract config entires, where each entry has its
 * unique name and set of EVM event names derived from the contract's ABI. Ponder will use contract
 * names and their respective event names to create names for indexing handlers. For example, a contract
 * named  `Registry` includes events: `NewResolver` and `NewTTL`. Ponder will create indexing handlers
 * named `Registry:NewResolver` and `Registry:NewTTL`.
 *
 * However, because plugins within ENSIndexer may use the same contract/event names, an additional
 * namespace prefix is required to distinguish between contracts having the same name, with different
 * implementations. The strong typing is helpful and necessary for Ponder's auto-generated types to apply.
 *
 * @example
 * ```ts
 * const subgraphNamespace = makePluginNamespace(PluginName.Subgraph);
 * const basenamesNamespace = makePluginNamespace(PluginName.Basenames);
 *
 * subgraphNamespace("Registry"); // returns "subgraph/Registry"
 * basenamesNamespace("Registry"); // returns "basenames/Registry"
 * ```
 *
 * Note: we use templated type here to ensure that the output type follow the literal value from the function input.
 */
export function makePluginNamespace<const PluginNameType extends PluginName>(
  pluginName: PluginNameType,
) {
  if (/[.:]/.test(pluginName)) {
    throw new Error("Reserved character: Plugin namespace prefix cannot contain '.' or ':'");
  }

  /**
   * Creates a namespaced contract name
   *
   * Note: we use templated type here to ensure that the output type follow the literal value from the function input.
   */
  return function pluginNamespace<const ContractNameType extends string>(
    contractName: ContractNameType,
  ): `${PluginNameType}/${ContractNameType}` {
    return `${pluginName}/${contractName}` as const;
  };
}

/**
 * Describes an ENSIndexerPlugin used within the ENSIndexer project.
 *
 * Note: all templated types have been use to bind types derived from plugin's
 * config literals and make them available for proper type inference.
 */
export interface ENSIndexerPlugin<
  PluginNameType extends PluginName = PluginName,
  RequiredDatasourceNamesType extends readonly DatasourceName[] = DatasourceName[],
  PonderChainsType extends object = {},
  PonderContractsType extends object = {},
  PonderAccountsType extends object = {},
  PonderBlocksType extends object = {},
> {
  /**
   * The plugin's unique name.
   */
  name: PluginNameType;

  /**
   * The list of DatasourceNames this plugin requires access to. ENSIndexer enforces that a plugin
   * can only be activated if all of its required Datasources are defined on the configured ENS Namespace.
   */
  requiredDatasourceNames: RequiredDatasourceNamesType;

  /**
   * Create Ponder Config for the plugin.
   *
   * @param {ENSIndexerConfig} ensIndexerConfig
   */
  createPonderConfig(
    ensIndexerConfig: ENSIndexerConfig,
  ): PonderConfigResult<
    PonderChainsType,
    PonderContractsType,
    PonderAccountsType,
    PonderBlocksType
  >;
}

/**
 * Helper type to capture the return type of `createPonderConfig` with its `const` inferred generics.
 * This is the exact shape of a Ponder config.
 *
 * Note: all templated types have been use to bind types derived from the `createPonderConfig`'s input params
 * and make them available for proper type inference in the `createPonderConfig` caller's scope.
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
 */
export interface BuildPluginOptions<
  PluginNameType extends PluginName,
  RequiredDatasourceNamesType extends readonly DatasourceName[],
  // This generic will capture the exact PonderConfigResult, including the inferred types.
  PonderConfigResultType extends PonderConfigResult,
> {
  /** The unique plugin name */
  name: PluginNameType;

  /** The plugin's required Datasources */
  requiredDatasourceNames: RequiredDatasourceNamesType;

  /**
   * Create the ponder configuration lazily to prevent premature execution of
   * nested factory functions, i.e. to ensure that the ponder configuration
   * is only created for this plugin when it is activated.
   */
  createPonderConfig(ensIndexerConfig: ENSIndexerConfig): PonderConfigResultType;
}

/**
 * Builds an ENSIndexerPlugin for ENSIndexer.
 *
 * This function simplifies building an ENSIndexerPlugin.
 *
 * The special type system logic is used when building the MergedPonderConfig that is required by Ponder.
 */
export function buildPlugin<
  PluginNameType extends PluginName,
  PluginRequiredDatasourceNamesType extends readonly DatasourceName[],
  PonderConfigResultType extends PonderConfigResult,
>(
  options: BuildPluginOptions<
    PluginNameType,
    PluginRequiredDatasourceNamesType,
    PonderConfigResultType
  >,
): ENSIndexerPlugin<
  PluginNameType,
  PluginRequiredDatasourceNamesType,
  PonderConfigResultType["networks"],
  PonderConfigResultType["contracts"],
  PonderConfigResultType["accounts"],
  PonderConfigResultType["blocks"]
> {
  return options;
}

export function getRequiredDatasourceNames(plugins: ENSIndexerPlugin[]): DatasourceName[] {
  const requiredDatasourceNames = plugins.flatMap((plugin) => plugin.requiredDatasourceNames);

  return uniq(requiredDatasourceNames);
}
