import { deepMergeRecursive } from "./src/lib/helpers";
import { type IntersectionOf, getActivePlugins } from "./src/lib/plugin-helpers";
import * as baseEthPlugin from "./src/plugins/base.eth/ponder.config";
import * as ethPlugin from "./src/plugins/eth/ponder.config";
import * as lineaEthPlugin from "./src/plugins/linea.eth/ponder.config";

const plugins = [baseEthPlugin, ethPlugin, lineaEthPlugin] as const;

// The type of the exported default is the intersection of all plugin configs to
// each plugin can be correctly typechecked
type AllPluginsConfig = IntersectionOf<(typeof plugins)[number]["config"]>;

export default loadActivePlugins();

/**
 * Activates the indexing handlers included in selected active plugins and returns their combined config.
 */
function loadActivePlugins(): AllPluginsConfig {
  const activePlugins = getActivePlugins(plugins);

  activePlugins.forEach((plugin) => plugin.activate());

  const config = activePlugins
    .map((plugin) => plugin.config)
    .reduce((acc, val) => deepMergeRecursive(acc, val), {} as AllPluginsConfig);

  return config as AllPluginsConfig;
}
