import { INDEXED_SUBNAME } from "./src/lib/ens-helpers";
import {
  activate as activateEthBase,
  config as ethBaseConfig,
  indexedSubname as ethBaseIndexedSubname,
} from "./src/ponder-ens-plugins/eth.base/ponder.config";
import {
  activate as activateEth,
  config as ethConfig,
  indexedSubname as ethIndexedSubname,
} from "./src/ponder-ens-plugins/eth/ponder.config";

type AllConfigs = typeof ethConfig & typeof ethBaseConfig;

// here we export only a single 'plugin's config, by type it as every config
// this makes all of the mapping types happy at typecheck-time, but only the relevant
// config is run at runtime
export default ((): AllConfigs => {
  switch (INDEXED_SUBNAME) {
    case ethIndexedSubname:
      activateEth();
      return ethConfig as AllConfigs;
    case ethBaseIndexedSubname:
      activateEthBase();
      return ethBaseConfig as AllConfigs;
    default:
      throw new Error(`Unsupported base name: ${INDEXED_SUBNAME}`);
  }
})();
