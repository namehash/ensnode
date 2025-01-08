import { ACTIVE_PLUGIN } from "./src/lib/subname-helpers";
import {
  activate as activateEthBase,
  config as ethBaseConfig,
  managedSubname as ethBaseManagedSubname,
} from "./src/plugins/base.eth/ponder.config";
import {
  activate as activateEth,
  config as ethConfig,
  managedSubname as ethManagedSubname,
} from "./src/plugins/eth/ponder.config";

type AllConfigs = typeof ethConfig & typeof ethBaseConfig;

// here we export only a single 'plugin's config, by type it as every config
// this makes all of the mapping types happy at typecheck-time, but only the relevant
// config is run at runtime
export default ((): AllConfigs => {
  switch (ACTIVE_PLUGIN) {
    case ethManagedSubname:
      activateEth();
      return ethConfig as AllConfigs;
    case ethBaseManagedSubname:
      activateEthBase();
      return ethBaseConfig as AllConfigs;
    default:
      throw new Error(`Unsupported ACTIVE_PLUGIN: ${ACTIVE_PLUGIN}`);
  }
})();
