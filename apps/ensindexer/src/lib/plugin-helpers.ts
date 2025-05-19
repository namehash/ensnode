import { ContractConfig, DatasourceName, ENSDeploymentChain } from "@ensnode/ens-deployments";
import type { NetworkConfig } from "ponder";
import { http, Address, Chain, isAddress } from "viem";

import config from "@/config/app-config";
import { ENSIndexerConfig } from "@/config/types";
import { MERGED_ENS_DEPLOYMENT, SELECTED_ENS_DEPLOYMENT } from "@/lib/globals";
import { constrainContractBlockrange } from "@/lib/ponder-helpers";
import { Label, Name, PluginName } from "@ensnode/utils";

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
export function makePluginNamespace<PLUGIN_NAME extends PluginName>(pluginName: PLUGIN_NAME) {
  if (/[.:]/.test(pluginName)) {
    throw new Error("Reserved character: Plugin namespace prefix cannot contain '.' or ':'");
  }

  /** Creates a namespaced contract name */
  return function pluginNamespace<CONTRACT_NAME extends string>(
    contractName: CONTRACT_NAME,
  ): `${PLUGIN_NAME}/${CONTRACT_NAME}` {
    return `${pluginName}/${contractName}`;
  };
}

/**
 * Returns a list of 1 or more distinct active plugins based on the `ACTIVE_PLUGINS` environment variable.
 *
 * The `ACTIVE_PLUGINS` environment variable is a comma-separated list of plugin
 * names. The function returns the plugins that are included in the list.
 *
 * @throws if invalid plugins are requested
 * @throws if activated plugins' `requiredDatasources` are not available in the set of `availableDatasourceNames`
 *
 * @param availablePlugins a list of all available plugins
 * @param requestedPluginNames list of user-requested plugin names
 * @param availableDatasourceNames is a list of available DatasourceNames
 * @returns the active plugins
 */
export function getActivePlugins<PLUGIN extends ENSIndexerPlugin>(
  availablePlugins: readonly PLUGIN[],
  requestedPluginNames: Set<PluginName>,
  availableDatasourceNames: DatasourceName[],
): PLUGIN[] {
  // filter allPlugins by those that the user requested
  const activePlugins = availablePlugins.filter((plugin) =>
    requestedPluginNames.has(plugin.pluginName),
  );

  // validate that each active plugin's requiredDatasources are available in availableDatasourceNames
  for (const plugin of activePlugins) {
    const hasRequiredDatasources = plugin.requiredDatasources.every((datasourceName) =>
      availableDatasourceNames.includes(datasourceName),
    );

    if (!hasRequiredDatasources) {
      throw new Error(
        `Requested plugin '${plugin.pluginName}' cannot be activated for the ${
          config.ensDeploymentChain
        } deployment. ${
          plugin.pluginName
        } specifies dependent datasources: ${plugin.requiredDatasources.join(
          ", ",
        )}, but available datasources in the ${
          config.ensDeploymentChain
        } deployment are: ${availableDatasourceNames.join(", ")}.`,
      );
    }
  }

  return activePlugins;
}

// Helper type to merge multiple types into one
export type MergedTypes<T> = (T extends any ? (x: T) => void : never) extends (x: infer R) => void
  ? R
  : never;

/**
 * Describes an ENSIndexerPlugin used within the ENSIndexer project.
 */
export interface ENSIndexerPlugin<PLUGIN_NAME extends PluginName = PluginName, CONFIG = unknown> {
  /**
   * A unique plugin name for identification
   */
  pluginName: PLUGIN_NAME;

  /**
   * A list of DatasourceNames this plugin requires access to, necessary for determining whether
   * a set of ACTIVE_PLUGINS are valid for a given ENS_DEPLOYMENT_CHAIN
   */
  requiredDatasources: DatasourceName[];

  /**
   * An ENSIndexerPlugin must return a Ponder Config.
   * https://ponder.sh/docs/contracts-and-networks
   */
  config: CONFIG;

  /**
   * An `activate` handler that should load a plugin's handlers that eventually execute `ponder.on`
   */
  activate: () => Promise<void>;
}

/**
 * An ENSIndexerPlugin's handlers are provided runtime information about their respective plugin.
 */
export type ENSIndexerPluginHandlerArgs<PLUGIN_NAME extends PluginName = PluginName> = {
  pluginName: PluginName;
  namespace: ReturnType<typeof makePluginNamespace<PLUGIN_NAME>>;
};

/**
 * An ENSIndexerPlugin accepts ENSIndexerPluginHandlerArgs and registers ponder event handlers.
 */
export type ENSIndexerPluginHandler<PLUGIN_NAME extends PluginName> = (
  args: ENSIndexerPluginHandlerArgs<PLUGIN_NAME>,
) => void;

/**
 * A helper function for defining an ENSIndexerPlugin's `activate()` function.
 *
 * Given a set of handler file imports, returns a function that executes them with the provided args.
 */
export const activateHandlers =
  <PLUGIN_NAME extends PluginName>({
    handlers,
    ...args
  }: ENSIndexerPluginHandlerArgs<PLUGIN_NAME> & {
    handlers: Promise<{ default: ENSIndexerPluginHandler<PLUGIN_NAME> }>[];
  }) =>
  async () => {
    await Promise.all(handlers).then((modules) => modules.map((m) => m.default(args)));
  };

/**
 * Defines a ponder#NetworksConfig for a single, specific chain.
 */
export function networksConfigForChain(config: ENSIndexerConfig, chainId: number) {
  return {
    [chainId.toString()]: {
      chainId: chainId,
      // This may return undefined if the RPC URL is not configured for the chain.
      // This is intentional to allow us to aggregate all the RPC URLs that are missing in a
      // later validation step allowing us to throw a helpful error message aggregating them
      // all instead of throwing an error here which will only flag a single missing RPC URL.
      // The code which does that validation is the `validateChainConfigs` function in
      // `src/config/validations.ts`.
      transport: http(config.indexedChains[chainId]?.rpcEndpointUrl),
      // This can only return undefined if there is no RPC url for the chain. This
      // means the `validateChainConfigs` function in `src/config/validations.ts` will
      // throw an error so we don't need to handle undefined here with a default.
      // That is already handled in our schema validation so when the RPC url is added
      // this will not be undefined.
      maxRequestsPerSecond: config.indexedChains[chainId]?.rpcMaxRequestsPerSecond,
      // NOTE: disable cache on local chains (e.g. Anvil, Ganache)
      ...((chainId === 31337 || chainId === 1337) && { disableCache: true }),
    } satisfies NetworkConfig,
  };
}

/**
 * Defines a `ponder#ContractConfig['network']` given a contract's config, constraining the contract's
 * indexing range by the globally configured blockrange.
 */
export function networkConfigForContract<CONTRACT_CONFIG extends ContractConfig>(
  chain: Chain,
  contractConfig: CONTRACT_CONFIG,
) {
  return {
    [chain.id.toString()]: {
      address: contractConfig.address, // provide per-network address if available
      ...constrainContractBlockrange(contractConfig.startBlock), // per-network blockrange
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
