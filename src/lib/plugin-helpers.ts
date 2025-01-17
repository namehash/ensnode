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
 * @param availablePlugins is a list of available plugins
 * @returns the active plugins
 */
export function getActivePlugins<T extends { ownedName: string }>(
  availablePlugins: readonly T[],
): T[] {
  /** @var comma separated list of the requested plugin names (see `src/plugins` for available plugins) */
  const requestedPluginsEnvVar = process.env.ACTIVE_PLUGINS;
  const requestedPlugins = requestedPluginsEnvVar ? requestedPluginsEnvVar.split(",") : [];

  if (!requestedPlugins.length) {
    throw new Error("Set the ACTIVE_PLUGINS environment variable to activate one or more plugins.");
  }

  // Check if the requested plugins are valid and can become active
  const invalidPlugins = requestedPlugins.filter(
    (requestedPlugin) =>
      !availablePlugins.some((availablePlugin) => availablePlugin.ownedName === requestedPlugin),
  );

  if (invalidPlugins.length) {
    // Throw an error if there are invalid plugins
    throw new Error(
      `Invalid plugin names found: ${invalidPlugins.join(
        ", ",
      )}. Please check the ACTIVE_PLUGINS environment variable.`,
    );
  }

  const uniquePluginsToActivate = availablePlugins.reduce((acc, plugin) => {
    // Only add the plugin if it's not already in the map
    if (acc.has(plugin.ownedName) === false) {
      acc.set(plugin.ownedName, plugin);
    }
    return acc;
  }, new Map<string, T>());

  return Array.from(uniquePluginsToActivate.values());
}

// Helper type to merge multiple types into one
export type MergedTypes<T> = (T extends any ? (x: T) => void : never) extends (x: infer R) => void
  ? R
  : never;
