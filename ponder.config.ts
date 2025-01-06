import { BASENAME } from "./src/lib/ens-helpers";
import {
  activate as activateBase,
  baseName as baseBaseName,
  config as baseConfig
} from "./src/ponder-ens-plugins/eth.base/ponder.config";
import {
  activate as activateEth,
  baseName as ethBaseName,
  config as ethereumConfig
} from "./src/ponder-ens-plugins/eth/ponder.config";

type AllConfigs = typeof ethereumConfig & typeof baseConfig;

// here we export only a single 'plugin's config, by type it as every config
// this makes all of the mapping types happy at typecheck-time, but only the relevant
// config is run at runtime
export default ((): AllConfigs => {
  switch (BASENAME) {
    case ethBaseName:
      activateEth();
      return ethereumConfig as AllConfigs;
    case baseBaseName:
      activateBase();
      return baseConfig as AllConfigs;
    default:
      throw new Error(`Unsupported base name: ${BASENAME}`);
  }
})();
