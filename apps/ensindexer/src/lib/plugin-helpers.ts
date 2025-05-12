import type { ContractConfig, DatasourceName } from "@ensnode/ens-deployments";
import type { NetworkConfig } from "ponder";
import { http, Address, Chain, isAddress } from "viem";

import {
  constrainContractBlockrange,
  getEnsDeploymentChain,
  rpcEndpointUrl,
  rpcMaxRequestsPerSecond,
} from "@/lib/ponder-helpers";
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
  requestedPluginNames: string[],
  availableDatasourceNames: DatasourceName[],
): PLUGIN[] {
  if (!requestedPluginNames.length) throw new Error("Must activate at least 1 plugin.");

  // validate that each of the requestedPluginNames is included in allPlugins
  const invalidPlugins = requestedPluginNames.filter(
    (requestedPlugin) => !availablePlugins.some((plugin) => plugin.pluginName === requestedPlugin),
  );

  if (invalidPlugins.length) {
    // Throw an error if there are invalid plugins
    throw new Error(
      `Invalid plugin names found: ${invalidPlugins.join(
        ", ",
      )}. Please check the ACTIVE_PLUGINS environment variable.`,
    );
  }

  // filter allPlugins by those that the user requested
  const activePlugins = availablePlugins.filter((plugin) =>
    requestedPluginNames.includes(plugin.pluginName),
  );

  // validate that each active plugin's requiredDatasources are available in availableDatasourceNames
  for (const plugin of activePlugins) {
    const hasRequiredDatasources = plugin.requiredDatasources.every((datasourceName) =>
      availableDatasourceNames.includes(datasourceName),
    );

    if (!hasRequiredDatasources) {
      throw new Error(
        `Requested plugin '${plugin.pluginName}' cannot be activated for the ${getEnsDeploymentChain()} deployment. ${plugin.pluginName} specifies dependent datasources: ${plugin.requiredDatasources.join(", ")}, but available datasources in the ${getEnsDeploymentChain()} deployment are: ${availableDatasourceNames.join(", ")}.`,
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
export function networksConfigForChain(chain: Chain) {
  return {
    [chain.id.toString()]: {
      chainId: chain.id,
      transport: http(rpcEndpointUrl(chain.id)),
      maxRequestsPerSecond: rpcMaxRequestsPerSecond(chain.id),
      // NOTE: disable cache on 'Anvil' chains
      ...(chain.name === "Anvil" && { disableCache: true }),
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

/**
 * Validates runtime contract configuration.
 *
 * @param contracts - An array of contract configurations to validate
 * @throws {Error} If any contract with an address field has an invalid address format
 */
export function validateContractConfigs<CONTRACT_CONFIGS extends Record<string, ContractConfig>>(
  pluginName: PluginName,
  contracts: CONTRACT_CONFIGS,
) {
  // invariant: `contracts` must provide valid addresses if a filter is not provided
  //  (see packages/ens-deployments/src/ens-test-env.ts) for context
  const hasAddresses = Object.values(contracts)
    .filter((config) => "address" in config) // only ContractConfigs with `address` defined
    .every((config) => isAddress(config.address as Address)); // must be a valid `Address`

  if (!hasAddresses) {
    throw new Error(
      `The ENSDeployment '${getEnsDeploymentChain()}' provided to the '${pluginName}' plugin does not define valid addresses. This occurs if the 'address' of any ContractConfig in the ENSDeployment is malformed (i.e. not an Address). This is only likely to occur if you are running the 'ens-test-env' ENSDeployment outside of the context of the ens-test-env tool (https://github.com/ensdomains/ens-test-env). If you are activating the ens-test-env plugin and receive this error, NEXT_PUBLIC_DEPLOYMENT_ADDRESSES or DEPLOYMENT_ADDRESSES is not available in the env or is malformed.

Here are the contract configs we attempted to validate:
${JSON.stringify(contracts)}`,
    );
  }
}
