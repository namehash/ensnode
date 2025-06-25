import type { ENSIndexerConfig, RpcConfig } from "@/config/types";
import { networkConfigForContract, networksConfigForChain } from "@/lib/ponder-helpers";
import { Blockrange } from "@/lib/types";
import {
  ContractConfig,
  DatasourceName,
  ENSNamespaceId,
  getENSNamespace,
} from "@ensnode/datasources";
import { Label, Name, PluginName } from "@ensnode/ensnode-sdk";
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
 */
export function makePluginNamespace<const PLUGIN_NAME extends PluginName>(pluginName: PLUGIN_NAME) {
  if (/[.:]/.test(pluginName)) {
    throw new Error("Reserved character: Plugin namespace prefix cannot contain '.' or ':'");
  }

  /** Creates a namespaced contract name */
  return function pluginNamespace<const CONTRACT_NAME extends string>(
    contractName: CONTRACT_NAME,
  ): `${PLUGIN_NAME}/${CONTRACT_NAME}` {
    return `${pluginName}/${contractName}` as const;
  };
}

/**
 * Describes an ENSIndexerPlugin used within the ENSIndexer project.
 */
export interface ENSIndexerPlugin<
  PLUGIN_NAME extends PluginName,
  REQUIRED_DATASOURCES extends readonly DatasourceName[],
  CHAINS extends object,
  CONTRACTS extends object,
  ACCOUNTS extends object = {},
  BLOCKS extends object = {},
> {
  /**
   * A unique plugin name for identification
   */
  name: PLUGIN_NAME;

  /**
   * Function to prefix a contract name with the plugin's namespace.
   *
   * It allows multiple plugins to provide configuration for the same contract name,
   * for example, `Registry`, and at the same time, enables creating separate event handlers
   * for each plugin.
   *
   * Examples:
   * - PluginName.Basenames
   *   `(parameter) namespace: <"Registry">(contractName: "Registry") => "basenames/Registry"`
   * - PluginName.Lineanames
   *   `(parameter) namespace: <"Registry">(contractName: "Registry") => "lineanames/Registry"`
   *
   * For more details, see {@link makePluginNamespace}.
   */
  namespace: MakePluginNamespaceResult<PLUGIN_NAME>;

  /**
   * The list of DatasourceNames this plugin requires access to. ENSIndexer enforces that a plugin
   * can only be activated if all of its required Datasources are defined on the configured ENS Namespace.
   */
  requiredDatasources: REQUIRED_DATASOURCES;

  /**
   * Get Ponder Config for the plugin.
   *
   * @param {ENSIndexerConfigSlice} ensIndexerConfig
   */
  getPonderConfig(
    ensIndexerConfig: ENSIndexerConfig,
  ): PonderConfigResult<CHAINS, CONTRACTS, ACCOUNTS, BLOCKS>;
}

/**
 * An ENSIndexerPlugin's handlers are provided runtime information about their respective plugin.
 */
export type ENSIndexerPluginHandlerArgs<PLUGIN_NAME extends PluginName = PluginName> = {
  pluginName: PLUGIN_NAME;
  pluginNamespace: MakePluginNamespaceResult<PLUGIN_NAME>;
};

/**
 * An ENSIndexerPlugin accepts ENSIndexerPluginHandlerArgs and registers ponder event handlers.
 */
export type ENSIndexerPluginHandler<PLUGIN_NAME extends PluginName = PluginName> = (
  args: ENSIndexerPluginHandlerArgs<PLUGIN_NAME>,
) => void;

// Helper type to extract the contracts type for a given datasource name
type ContractsForDatasource<DATASOURCE_NAME extends DatasourceName> = ReturnType<
  typeof getENSNamespaceAsFullyDefinedAtCompileTime
>[DATASOURCE_NAME]["contracts"];

/**
 * Result type for {@link getDatasourceConfigOptions}
 */
interface DatasourceConfigOptions<DATASOURCE_NAME extends DatasourceName> {
  /**
   * Contracts configuration for the datasource (comes from `requiredDatasources`)
   */
  contracts: ContractsForDatasource<DATASOURCE_NAME>;

  /**
   * Networks configuration for the datasource
   */
  networks: ReturnType<typeof networksConfigForChain>;

  /**
   * Contract-specific network configuration for the datasource
   *
   * @param contractConfig
   * @returns
   */
  getContractNetwork: <CONTRACT_CONFIG extends ContractConfig>(
    contractConfig: CONTRACT_CONFIG,
  ) => ReturnType<typeof networkConfigForContract>;
}

/**
 * Options for `buildPonderConfig` callback on {@link BuildPluginOptions} type.
 */
export interface PluginConfigOptions<
  PLUGIN_NAME extends PluginName,
  DATASOURCE_NAME extends DatasourceName,
> {
  /**
   * A function to get DatasourceConfigOptions for a given datasource name.
   * This is used to build the Ponder configuration for the plugin.
   *
   * @param datasourceName - The name of the datasource to get options for
   * @returns DatasourceConfigOptions for the specified datasource
   */
  datasourceConfigOptions(
    datasourceName: DATASOURCE_NAME,
  ): DatasourceConfigOptions<DATASOURCE_NAME>;

  /**
   * A function to create a namespaced contract name for the plugin.
   * This is used to ensure that contract names are unique across plugins.
   *
   * See {@link makePluginNamespace} for more details.
   */
  pluginNamespace: MakePluginNamespaceResult<PLUGIN_NAME>;
}

/**
 * Options type for `buildPlugin` function input.
 */
export interface BuildPluginOptions<
  PLUGIN_NAME extends PluginName,
  REQUIRED_DATASOURCES extends readonly DatasourceName[],
  // This generic will capture the exact PonderConfigResult, including the inferred types.
  PONDER_CONFIG extends PonderConfigResult,
> {
  /** The unique plugin name */
  name: PLUGIN_NAME;

  /** The plugin's required Datasources */
  requiredDatasources: REQUIRED_DATASOURCES;

  /**
   * Build the ponder configuration lazily to prevent premature execution of
   * nested factory functions, i.e. to ensure that the ponder configuration
   * is only created for this plugin when it is activated.
   */
  buildPonderConfig(
    options: PluginConfigOptions<PLUGIN_NAME, REQUIRED_DATASOURCES[number]>,
  ): PONDER_CONFIG;
}

/**
 * Helper type to capture the return type of `createPonderConfig` with its `const` inferred generics.
 * This is the exact shape of a Ponder config.
 */
type PonderConfigResult<
  CHAINS extends object = {},
  CONTRACTS extends object = {},
  ACCOUNTS extends object = {},
  BLOCKS extends object = {},
> = ReturnType<typeof createPonderConfig<CHAINS, CONTRACTS, ACCOUNTS, BLOCKS>>;

/**
 * Helper type to capture a contract namespace factory type for a given plugin name.
 */
type MakePluginNamespaceResult<PLUGIN_NAME extends PluginName> = ReturnType<
  typeof makePluginNamespace<PLUGIN_NAME>
>;

const POSSIBLE_PREFIXES = [
  "data:application/json;base64,",
  "data:application/json;_base64,", // idk, sometimes 3dns returns this malformed prefix
];

/**
 * Parses a base64-encoded JSON metadata URI to extract the label and name.
 *
 * @param uri - The base64-encoded JSON metadata URI string
 * @returns A tuple containing [label, name] if parsing succeeds, or [null, null] if it fails
 */
export function parseLabelAndNameFromOnChainMetadata(uri: string): [Label, Name] | [null, null] {
  if (!POSSIBLE_PREFIXES.some((prefix) => uri.startsWith(prefix))) {
    // console.error("Invalid tokenURI format:", uri);
    return [null, null];
  }

  const base64String = POSSIBLE_PREFIXES.reduce((memo, prefix) => memo.replace(prefix, ""), uri);
  const jsonString = Buffer.from(base64String, "base64").toString("utf-8");
  const metadata = JSON.parse(jsonString);

  // trim the . off the end of the fqdn
  const name = metadata?.name?.slice(0, -1);
  if (!name) return [null, null];

  const [label] = name.split(".");

  return [label, name];
}

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
 * Get Datasource Config Options for a given datasource name.
 * Used as data provider to `buildPonderConfig` function,
 * where Ponder Configuration object is built for a specific plugin.
 *
 * @param ensDeploymentChain
 * @param globalBlockrange
 * @param rpcConfigs
 * @param datasourceName
 * @returns
 */
export function getDatasourceConfigOptions<const DATASOURCE_NAME extends DatasourceName>(
  ensNamespaceId: ENSNamespaceId,
  globalBlockrange: Blockrange,
  rpcConfigs: Record<number, RpcConfig>,
  datasourceName: DATASOURCE_NAME,
): DatasourceConfigOptions<DATASOURCE_NAME> {
  // First, get the datasource object for a given `ensNamespaceId` and `datasourceName`.
  const datasource = getENSNamespaceAsFullyDefinedAtCompileTime(ensNamespaceId)[datasourceName];
  const chainId = datasource.chain.id;

  // Then, get contracts configuration from the selected datasource object.
  const contracts = datasource.contracts;

  // Networks configuration based on rpcConfigs and datasource chain ID.
  // Used for building the plugin's ponder config object.
  const networks = networksConfigForChain(chainId, rpcConfigs);

  // Create a getter function that allows accessing network configuration for a given `contractConfig`
  // Get network configuration based on contract config, global blockrange, and datasource chain configuration.
  // Used for building the plugin's ponder config object.
  const getContractNetwork = <CONTRACT_CONFIG extends ContractConfig>(
    contractConfig: CONTRACT_CONFIG,
  ) => networkConfigForContract(chainId, globalBlockrange, contractConfig);

  return {
    contracts,
    networks,
    getContractNetwork,
  } as const;
}

/**
 * Build Plugin for ENSIndexer.
 *
 * This factory function allows building a plugin object in a confident way,
 * leveraging type system to build Ponder configuration for the plugin and
 * use it when defining the global Ponder configuration object from
 * all active plugins.
 */
export function buildPlugin<
  PLUGIN_NAME extends PluginName,
  REQUIRED_DATASOURCES extends readonly DatasourceName[],
  PONDER_CONFIG extends PonderConfigResult,
>(
  options: BuildPluginOptions<PLUGIN_NAME, REQUIRED_DATASOURCES, PONDER_CONFIG>,
): ENSIndexerPlugin<
  PLUGIN_NAME,
  REQUIRED_DATASOURCES,
  PONDER_CONFIG["networks"],
  PONDER_CONFIG["contracts"],
  PONDER_CONFIG["accounts"],
  PONDER_CONFIG["blocks"]
> {
  const pluginName = options.name;
  const pluginNamespace = makePluginNamespace(pluginName);
  const requiredDatasources = options.requiredDatasources;

  const getPonderConfig = (config: ENSIndexerConfig): PONDER_CONFIG => {
    const { namespace: ensNamespaceId, globalBlockrange, rpcConfigs } = config;

    return options.buildPonderConfig({
      datasourceConfigOptions<DATASOURCE_NAME extends REQUIRED_DATASOURCES[number]>(
        datasourceName: DATASOURCE_NAME,
      ) {
        return getDatasourceConfigOptions(
          ensNamespaceId,
          globalBlockrange,
          rpcConfigs,
          datasourceName,
        );
      },
      pluginNamespace,
    });
  };

  return {
    name: pluginName,
    namespace: pluginNamespace,
    requiredDatasources,
    getPonderConfig,
  } as const satisfies ENSIndexerPlugin<
    PLUGIN_NAME,
    REQUIRED_DATASOURCES,
    PONDER_CONFIG["networks"],
    PONDER_CONFIG["contracts"],
    PONDER_CONFIG["accounts"],
    PONDER_CONFIG["blocks"]
  >;
}
