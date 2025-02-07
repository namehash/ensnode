import type { PluginContractConfig, PluginName } from "@namehash/ens-deployments";
import type { NetworkConfig } from "ponder";
import { http, Chain } from "viem";
import { END_BLOCK, START_BLOCK } from "./globals";
import { uniq } from "./lib-helpers";
import { blockConfig, rpcEndpointUrl, rpcMaxRequestsPerSecond } from "./ponder-helpers";
import type { OwnedName } from "./types";

/**
 * A factory function that returns a function to create a namespaced contract
 * name for Ponder indexing handlers.
 *
 * Ponder config requires a flat dictionary of contract config entires, where
 * each entry has its unique name and set of EVM event names derived from
 * the contract's ABI. Ponder will use contract names and their respective
 * event names to create names for indexing handlers. For example, a contract
 * named  `Registry` includes events: `NewResolver` and `NewTTL`. Ponder will
 * create indexing handlers named `Registry:NewResolver` and `Registry:NewTTL`.
 *
 * However, in some cases, we may want to create a namespaced contract name to
 * distinguish between contracts having the same name, but handling different
 * implementations.
 *
 * Let's say we have two contracts named `Registry`. One handles `eth` subnames
 * and the other handles `base.eth` subnames. We need to create a namespaced
 * contract name to avoid conflicts.
 * We could use the actual name/subname as a prefix, like `eth/Registry` and
 * `base.eth/Registry`. We cannot do that, though, as Ponder does not support
 * dots and colons in its indexing handler names.
 *
 * We need to use a different separator, in this case, a forward slash within
 * a path-like format.
 *
 * @param subname
 *
 * @example
 * ```ts
 * const boxNs = createPluginNamespace("box");
 * const ethNs = createPluginNamespace("base.eth");
 * const baseEthNs = createPluginNamespace("base.eth");
 *
 * boxNs("Registry"); // returns "/box/Registry"
 * ethNs("Registry"); // returns "/eth/Registry"
 * baseEthNs("Registry"); // returns "/base/eth/Registry"
 * ```
 */
export function createPluginNamespace<Subname extends string>(subname: Subname) {
  const namespacePath = nameIntoPath(subname) satisfies PluginNamespacePath;

  /** Creates a namespaced contract name */
  return function pluginNamespace<ContractName extends string>(
    contractName: ContractName,
  ): PluginNamespaceReturnType<ContractName, typeof namespacePath> {
    return `${namespacePath}/${contractName}`;
  };
}

type TransformNameIntoPath<Name extends string> = Name extends `${infer Sub}.${infer Rest}`
  ? `${TransformNameIntoPath<Rest>}/${Sub}`
  : `/${Name}`;

/**
 * Transforms a name into a path-like format, by reversing the name parts and
 * joining them with a forward slash. The name parts are separated by a dot.
 *
 * @param name is made of dot-separated labels
 * @returns path-like format of the reversed domain
 *
 * @example
 * ```ts
 * nameIntoPath("base.eth"); // returns "/eth/base"
 * nameIntoPath("my.box"); // returns "/box/my"
 **/
function nameIntoPath<Name extends string>(name: Name): TransformNameIntoPath<Name> {
  // TODO: validate the name
  return `/${name.split(".").reverse().join("/")}` as TransformNameIntoPath<Name>;
}

/** The return type of the `pluginNamespace` function */
type PluginNamespaceReturnType<
  ContractName extends string,
  NamespacePath extends PluginNamespacePath,
> = `${NamespacePath}/${ContractName}`;

type PluginNamespacePath<T extends PluginNamespacePath = "/"> =
  | ``
  | `/${string}`
  | `/${string}${T}`;

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
  /** @var comma separated list of the requested plugin names (see `src/plugins` for available plugins) */
  const requestedPluginsEnvVar = process.env.ACTIVE_PLUGINS;
  const requestedPluginNames = requestedPluginsEnvVar ? requestedPluginsEnvVar.split(",") : [];

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
      `Requested plugins are not available in this deployment: ${unavailablePlugins.join(
        ", ",
      )}. Available plugins are: ${availablePluginNames.join(", ")}`,
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
  activate: VoidFunction;
}

/**
 * An ENS Plugin's handlers are configured with ownedName and namespace.
 */
export type PonderENSPluginHandlerArgs<OWNED_NAME extends OwnedName> = {
  ownedName: OwnedName;
  namespace: ReturnType<typeof createPluginNamespace<OWNED_NAME>>;
};

/**
 * An ENS Plugin Handler
 */
export type PonderENSPluginHandler<OWNED_NAME extends OwnedName> = (
  options: PonderENSPluginHandlerArgs<OWNED_NAME>,
) => void;

/**
 * A helper function for defining a PonderENSPlugin's `activate()` function.
 *
 * Given a set of handler file imports, returns a function that executes them with the provided
 * `ownedName` and `namespace`.
 */
export const activateHandlers =
  <OWNED_NAME extends OwnedName>({
    handlers,
    ...args
  }: PonderENSPluginHandlerArgs<OWNED_NAME> & {
    handlers: Promise<{ default: PonderENSPluginHandler<OWNED_NAME> }>[];
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
        // disable rpc caching for anvil node
        ...(chain.id === 1337 && { disableCache: true }),
      } satisfies NetworkConfig;
    },
  };
}

/**
 * Defines a `ponder#ContractConfig['network']` given a contract's config, injecting the global
 * start/end blocks to constrain indexing range.
 */
export function networkConfigForContract<CONTRACT_CONFIG extends PluginContractConfig>(
  chain: Chain,
  contractConfig: CONTRACT_CONFIG,
) {
  return {
    [chain.id.toString()]: {
      ...contractConfig,
      ...blockConfig(START_BLOCK, contractConfig.startBlock, END_BLOCK),
    },
  };
}
