import type { ContractConfig } from "@ensnode/ens-deployments";
import type { NetworkConfig } from "ponder";
import { http, Chain } from "viem";

import {
  constrainContractBlockrange,
  getEnsDeploymentChain,
  requestedPluginNames as getRequestedPluginNames,
  rpcEndpointUrl,
  rpcMaxRequestsPerSecond,
} from "@/lib/ponder-helpers";
import type { RegistrarManagedName } from "@/lib/types";
import { PluginName } from "@ensnode/utils";

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
 * const rootNamespace = makePluginNamespace(PluginName.Root);
 * const basenamesNamespace = makePluginNamespace(PluginName.Basenames);
 *
 * rootNamespace("Registry"); // returns "root/Registry"
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
 * @param allPlugins a list of all plugins
 * @param availablePluginNames is a list of plugin names that can be used
 * @returns the active plugins
 */
export function getActivePlugins<T extends { pluginName: PluginName }>(
  allPlugins: readonly T[],
  availablePluginNames: PluginName[],
): T[] {
  /** @var a list of the requested plugin names (see `src/plugins` for available plugins) */
  const requestedPluginNames = getRequestedPluginNames();

  if (!requestedPluginNames.length) {
    throw new Error("Set the ACTIVE_PLUGINS environment variable to activate one or more plugins.");
  }

  // Check if the requested plugins are valid at all
  const invalidPlugins = requestedPluginNames.filter(
    (requestedPlugin) => !allPlugins.some((plugin) => plugin.pluginName === requestedPlugin),
  );

  if (invalidPlugins.length) {
    // Throw an error if there are invalid plugins
    throw new Error(
      `Invalid plugin names found: ${invalidPlugins.join(
        ", ",
      )}. Please check the ACTIVE_PLUGINS environment variable.`,
    );
  }

  // Ensure that the requested plugins only reference availablePluginNames
  const unavailablePlugins = requestedPluginNames.filter(
    (name) => !availablePluginNames.includes(name as PluginName),
  );

  if (unavailablePlugins.length) {
    throw new Error(
      `Requested plugins are not available in the ${getEnsDeploymentChain()} deployment: ${unavailablePlugins.join(
        ", ",
      )}. Available plugins in the ${getEnsDeploymentChain()} are: ${availablePluginNames.join(
        ", ",
      )}`,
    );
  }

  return (
    // return the set of all plugins...
    allPlugins
      // filtered by those that are available to the selected deployment
      .filter((plugin) => availablePluginNames.includes(plugin.pluginName))
      // and are requested by the user
      .filter((plugin) => requestedPluginNames.includes(plugin.pluginName))
  );
}

// Helper type to merge multiple types into one
export type MergedTypes<T> = (T extends any ? (x: T) => void : never) extends (x: infer R) => void
  ? R
  : never;

/**
 * A PonderENSPlugin provides a pluginName to identify it, a ponder config, and an activate
 * function to load handlers.
 */
export interface PonderENSPlugin<PLUGIN_NAME extends PluginName, CONFIG> {
  pluginName: PLUGIN_NAME;
  config: CONFIG;
  activate: () => Promise<void>;
}

/**
 * A PonderENSPlugin's handlers are provided runtime information about their respective plugin.
 */
export type PonderENSPluginHandlerArgs<PLUGIN_NAME extends PluginName> = {
  pluginName: PluginName;
  registrarManagedName: RegistrarManagedName;
  namespace: ReturnType<typeof makePluginNamespace<PLUGIN_NAME>>;
};

/**
 * A PonderENSPlugin accepts PonderENSPluginHandlerArgs and registers ponder event handlers.
 */
export type PonderENSPluginHandler<PLUGIN_NAME extends PluginName> = (
  args: PonderENSPluginHandlerArgs<PLUGIN_NAME>,
) => void;

/**
 * A helper function for defining a PonderENSPlugin's `activate()` function.
 *
 * Given a set of handler file imports, returns a function that executes them with the provided args.
 */
export const activateHandlers =
  <PLUGIN_NAME extends PluginName>({
    handlers,
    ...args
  }: PonderENSPluginHandlerArgs<PLUGIN_NAME> & {
    handlers: Promise<{ default: PonderENSPluginHandler<PLUGIN_NAME> }>[];
  }) =>
  async () => {
    await Promise.all(handlers).then((modules) => modules.map((m) => m.default(args)));
  };

/**
 * Defines a ponder#NetworksConfig for a single, specific chain.
 * Implemented as a computed getter to avoid runtime assertions for unused RPC env vars.
 */
export function networksConfigForChain(chain: Chain) {
  return {
    get [chain.id.toString()]() {
      return {
        chainId: chain.id,
        transport: http(rpcEndpointUrl(chain.id)),
        maxRequestsPerSecond: rpcMaxRequestsPerSecond(chain.id),
        // NOTE: disable cache on 'Anvil' chains
        ...(chain.name === "Anvil" && { disableCache: true }),
      } satisfies NetworkConfig;
    },
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
      ...contractConfig,
      ...constrainContractBlockrange(contractConfig.startBlock),
    },
  };
}
