import type { ENSIndexerConfig } from "@/config/types";
import type { Blockrange } from "@/lib/types";
import { type ContractConfig, DatasourceName, getENSDeployment } from "@ensnode/ens-deployments";
import { Label, Name, PluginName } from "@ensnode/ensnode-sdk";
import type { NetworkConfig, createConfig as createPonderConfig } from "ponder";
import { http, type Chain } from "viem";

/**
 * Define ENSIndexerPlugin.
 *
 * This factory function allows defining a plugin in a confident way,
 * leveraging type system to build Ponder configuration for the plugin and
 * use it when defining the global Ponder configuration object from
 * all active plugins.
 */
export function definePlugin<
  PLUGIN_NAME extends PluginName,
  REQUIRED_DATASOURCES extends readonly DatasourceName[],
  PONDER_CONFIG extends PonderConfigResult,
>(
  options: DefinePluginOptions<PLUGIN_NAME, REQUIRED_DATASOURCES, PONDER_CONFIG>,
): ENSIndexerPlugin<
  PLUGIN_NAME,
  REQUIRED_DATASOURCES,
  PONDER_CONFIG["networks"],
  PONDER_CONFIG["contracts"],
  PONDER_CONFIG["accounts"],
  PONDER_CONFIG["blocks"]
> {
  const namespace = makePluginNamespace(options.name);

  const getPonderConfig = (config: ENSIndexerConfigSlice): PONDER_CONFIG => {
    return options.buildPonderConfig({
      datasourceConfigOptions<DATASOURCE_NAME extends REQUIRED_DATASOURCES[number]>(
        datasourceName: DATASOURCE_NAME,
      ) {
        return getDatasourceConfigOptions(config, datasourceName);
      },
      namespace,
    });
  };

  return {
    getPonderConfig,
    name: options.name,
    requiredDatasources: options.requiredDatasources,
    namespace,
  } as const satisfies ENSIndexerPlugin<
    PLUGIN_NAME,
    REQUIRED_DATASOURCES,
    PONDER_CONFIG["networks"],
    PONDER_CONFIG["contracts"],
    PONDER_CONFIG["accounts"],
    PONDER_CONFIG["blocks"]
  >;
}

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
   * A list of DatasourceNames this plugin requires access to, necessary for determining whether
   * a set of ACTIVE_PLUGINS are valid for a given ENS_DEPLOYMENT_CHAIN
   */
  requiredDatasources: REQUIRED_DATASOURCES;

  /**
   * Get Ponder Config for the plugin.
   *
   * @param {ENSIndexerConfigSlice} ensIndexerConfig
   */
  getPonderConfig(
    ensIndexerConfig: ENSIndexerConfigSlice,
  ): PonderConfigResult<CHAINS, CONTRACTS, ACCOUNTS, BLOCKS>;

  /**
   * Wrap a contract name within the plugin's namespace.
   */
  namespace: MakePluginNamespaceResult<PLUGIN_NAME>;
}

/**
 * An ENSIndexerPlugin's handlers are provided runtime information about their respective plugin.
 */
export type ENSIndexerPluginHandlerArgs<PLUGIN_NAME extends PluginName = PluginName> = {
  name: PLUGIN_NAME;
  namespace: MakePluginNamespaceResult<PLUGIN_NAME>;
};

/**
 * An ENSIndexerPlugin accepts ENSIndexerPluginHandlerArgs and registers ponder event handlers.
 */
export type ENSIndexerPluginHandler<PLUGIN_NAME extends PluginName = PluginName> = (
  args: ENSIndexerPluginHandlerArgs<PLUGIN_NAME>,
) => void;

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
  networksConfigForChain: () => ReturnType<typeof networksConfigForChain>;

  /**
   * Contract-specific network configuration
   *
   * @param contractConfig
   * @returns
   */
  networkConfigForContract: <CONTRACT_CONFIG extends ContractConfig>(
    contractConfig: CONTRACT_CONFIG,
  ) => ReturnType<typeof networkConfigForContract>;
}

/**
 * Options for `buildPonderConfig` callback on {@link DefinePluginOptions} type.
 */
export interface PluginConfigOptions<
  PLUGIN_NAME extends PluginName,
  DATASOURCE_NAME extends DatasourceName,
> {
  datasourceConfigOptions(
    datasourceName: DATASOURCE_NAME,
  ): DatasourceConfigOptions<DATASOURCE_NAME>;
  namespace: MakePluginNamespaceResult<PLUGIN_NAME>;
}

/**
 * Options type for `definePlugin` function input.
 */
export interface DefinePluginOptions<
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
 * Helper type to capture the required slice of ENSIndexerConfig type for {@link getDatasourceConfigOptions}
 */
type ENSIndexerConfigSlice = Pick<
  ENSIndexerConfig,
  "ensDeploymentChain" | "globalBlockrange" | "rpcConfigs"
>;

/**
 * Helper type to capture specific datasource type from a given ENSDeployment.
 */
type DeploymentForDatasource<DATASOURCE_NAME extends DatasourceName> = ReturnType<
  typeof getENSDeployment
>[DATASOURCE_NAME];

/**
 * Helper type to capture specific contracts type from a given Datasource.
 */
type ContractsForDatasource<DATASOURCE_NAME extends DatasourceName> =
  DeploymentForDatasource<DATASOURCE_NAME>["contracts"];

/**
 * Helper type to capture a contract namespace factory type for a given plugin name.
 */
type MakePluginNamespaceResult<PLUGIN_NAME extends PluginName> = ReturnType<
  typeof makePluginNamespace<PLUGIN_NAME>
>;

/**
 * Builds a ponder#NetworksConfig for a single, specific chain.
 */
export function networksConfigForChain(
  config: Pick<ENSIndexerConfig, "rpcConfigs">,
  chainId: number,
) {
  if (!config.rpcConfigs[chainId]) {
    throw new Error(
      `networksConfigForChain called for chain id ${chainId} but no associated rpcConfig is available in ENSIndexerConfig. rpcConfig specifies the following chain ids: [${Object.keys(config.rpcConfigs).join(", ")}].`,
    );
  }

  const { url, maxRequestsPerSecond } = config.rpcConfigs[chainId]!;

  return {
    [chainId.toString()]: {
      chainId: chainId,
      transport: http(url),
      maxRequestsPerSecond,
      ...((chainId === 31337 || chainId === 1337) && { disableCache: true }),
    } satisfies NetworkConfig,
  };
}

/**
 * Builds a `ponder#ContractConfig['network']` given a contract's config, constraining the contract's
 * indexing range by the globally configured blockrange.
 */
export function networkConfigForContract<CONTRACT_CONFIG extends ContractConfig>(
  config: Pick<ENSIndexerConfig, "globalBlockrange">,
  chain: Chain,
  contractConfig: CONTRACT_CONFIG,
) {
  return {
    [chain.id.toString()]: {
      address: contractConfig.address, // provide per-network address if available
      ...constrainContractBlockrange(config, contractConfig.startBlock), // per-network blockrange
    },
  };
}

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
 * Given a contract's start block, returns a block range describing a start and end block
 * that maintains validity within the global blockrange. The returned start block will always be
 * defined, but if no end block is specified, the returned end block will be undefined, indicating
 * that ponder should index the contract in perpetuity.
 *
 * @param config the configuration object including `globalBlockrange` value
 * @param contractStartBlock the preferred start block for the given contract, defaulting to 0
 * @returns the start and end blocks, contrained to the provided `start` and `end`
 *  i.e. (startBlock || 0) <= (contractStartBlock || 0) <= (endBlock if specificed)
 */
export const constrainContractBlockrange = (
  config: Pick<ENSIndexerConfig, "globalBlockrange">,
  contractStartBlock: number | undefined = 0,
): Blockrange => {
  const { startBlock, endBlock } = config.globalBlockrange;

  const isEndConstrained = endBlock !== undefined;
  const concreteStartBlock = Math.max(startBlock || 0, contractStartBlock);

  return {
    startBlock: isEndConstrained ? Math.min(concreteStartBlock, endBlock) : concreteStartBlock,
    endBlock,
  };
};

/**
 * Get Datasource Config Options for a given datasource name.
 * Used as data provider to `buildPonderConfig` function,
 * where Ponder Configuration object is built for a specific plugin.
 *
 * @param config ENSIndexer config
 * @param datasourceName
 * @returns
 */
export function getDatasourceConfigOptions<const DATASOURCE_NAME extends DatasourceName>(
  config: Pick<ENSIndexerConfigSlice, "ensDeploymentChain" | "globalBlockrange" | "rpcConfigs">,
  datasourceName: DATASOURCE_NAME,
): DatasourceConfigOptions<DATASOURCE_NAME> {
  const deployment = getENSDeployment(config.ensDeploymentChain);
  const datasource = deployment[datasourceName] as DeploymentForDatasource<DATASOURCE_NAME>;

  return {
    contracts: datasource.contracts as ContractsForDatasource<DATASOURCE_NAME>,
    networksConfigForChain() {
      return networksConfigForChain(config, datasource.chain.id);
    },
    networkConfigForContract<CONTRACT_CONFIG extends ContractConfig>(
      contractConfig: CONTRACT_CONFIG,
    ) {
      return networkConfigForContract(config, datasource.chain, contractConfig);
    },
  } as const;
}
