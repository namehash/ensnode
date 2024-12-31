import { createConfig } from "ponder";
import { config as ethereumConfig} from "./src/ponder-ens-plugins/ethereum/ponder.config";

export default createConfig({
  networks: {
    ...ethereumConfig.networks,
  },
  contracts: {
    ...ethereumConfig.contracts,
  },
});
