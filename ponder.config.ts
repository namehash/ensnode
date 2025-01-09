import { ACTIVE_PLUGIN } from "./src/lib/plugin-helpers";
import * as baseEthPlugin from "./src/plugins/base.eth/ponder.config";
import * as ethPlugin from "./src/plugins/eth/ponder.config";
import * as lineaEthPlugin from "./src/plugins/linea.eth/ponder.config";

const plugins = [baseEthPlugin, ethPlugin, lineaEthPlugin] as const;

// here we export only a single 'plugin's config, by type it as every config
// this makes all of the mapping types happy at typecheck-time, but only the
// relevant config is run at runtime
export default ((): AllConfigs => {
  const pluginToActivate = plugins.find((p) => p.ownedName === ACTIVE_PLUGIN);

  if (!pluginToActivate) {
    throw new Error(`Unsupported ACTIVE_PLUGIN: ${ACTIVE_PLUGIN}`);
  }

  pluginToActivate.activate();

  return pluginToActivate.config as AllConfigs;
})();

// Helper type to get the intersection of all config types
type IntersectionOf<T> = (T extends any ? (x: T) => void : never) extends (x: infer R) => void
  ? R
  : never;
// The type of the exported default is the intersection of all plugin configs to
// each plugin can be correctly typechecked
type AllConfigs = IntersectionOf<(typeof plugins)[number]["config"]>;
