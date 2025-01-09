import { ACTIVE_PLUGIN } from "./src/lib/plugin-helpers";
import {
  activate as activateBaseEth,
  config as baseEthConfig,
  ownedName as baseEthOwnedName,
} from "./src/plugins/base.eth/ponder.config";
import {
  activate as activateEth,
  config as ethConfig,
  ownedName as ethOwnedName,
} from "./src/plugins/eth/ponder.config";
import {
  activate as activateLineaEth,
  config as lineaEthConfig,
  ownedName as lineaEthOwnedName,
} from "./src/plugins/linea.eth/ponder.config";

type AllConfigs = typeof ethConfig & typeof baseEthConfig & typeof lineaEthConfig;

// here we export only a single 'plugin's config, by type it as every config
// this makes all of the mapping types happy at typecheck-time, but only the relevant
// config is run at runtime
export default ((): AllConfigs => {
  switch (ACTIVE_PLUGIN) {
    case ethOwnedName:
      activateEth();
      return ethConfig as AllConfigs;
    case baseEthOwnedName:
      activateBaseEth();
      return baseEthConfig as AllConfigs;
    case lineaEthOwnedName:
      activateLineaEth();
      return lineaEthConfig as AllConfigs;
    default:
      throw new Error(`Unsupported ACTIVE_PLUGIN: ${ACTIVE_PLUGIN}`);
  }
})();
