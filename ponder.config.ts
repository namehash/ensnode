// import { deepMergeRecursive } from "./src/lib/helpers";
import { type IntersectionOf, getActivePlugins } from "./src/lib/plugin-helpers";
import * as baseEthPlugin from "./src/plugins/base.eth/ponder.config";
import * as ethPlugin from "./src/plugins/eth/ponder.config";
import * as lineaEthPlugin from "./src/plugins/linea.eth/ponder.config";

// list of all available plugins
// any of them can be activated in the runtime
const plugins = [baseEthPlugin, ethPlugin, lineaEthPlugin] as const;

// intersection of all available plugin configs to support correct typechecking
// of the indexing handlers
type AllPluginsConfig = IntersectionOf<(typeof plugins)[number]["config"]>;

// Activates the indexing handlers of activated plugins and
// returns the intersection of their combined config.
function getActivePluginsConfig(): AllPluginsConfig {
  const activePlugins = getActivePlugins(plugins);

  // load indexing handlers from the active plugins into the runtime
  activePlugins.forEach((plugin) => plugin.activate());

  const config = activePlugins
    .map((plugin) => plugin.config)
    .reduce((acc, val) => deepMergeRecursive(acc, val), {} as AllPluginsConfig);

  return config as AllPluginsConfig;
}

// The type of the default export is the intersection of all available plugin
// configs so that each plugin can be correctly typechecked
export default getActivePluginsConfig();

type AnyObject = { [key: string]: any };

/**
 * Deep merge two objects recursively.
 * @param target The target object to merge into.
 * @param source The source object to merge from.
 * @returns The merged object.
 * @see https://stackoverflow.com/a/48218209
 * @example
 * const obj1 = { a: 1, b: 2, c: { d: 3 } };
 * const obj2 = { a: 4, c: { e: 5 } };
 * const obj3 = deepMergeRecursive(obj1, obj2);
 * // { a: 4, b: 2, c: { d: 3, e: 5 } }
 */
export function deepMergeRecursive<T extends AnyObject, U extends AnyObject>(
  target: T,
  source: U,
): T & U {
  const output = { ...target } as T & U;

  function isObject(item: any): item is AnyObject {
    return item && typeof item === "object" && !Array.isArray(item);
  }

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          (output as AnyObject)[key] = deepMergeRecursive(
            (target as AnyObject)[key],
            (source as AnyObject)[key],
          );
        }
      } else if (Array.isArray(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          (output as AnyObject)[key] = Array.isArray((target as AnyObject)[key])
            ? [...(target as AnyObject)[key], ...source[key]]
            : source[key];
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}