import { createConfig } from "ponder";
import { config as baseConfig } from "./src/ponder-ens-plugins/eth.base/ponder.config";
import { config as ethereumConfig } from "./src/ponder-ens-plugins/eth/ponder.config";

console.log({
  networks: {
    ...baseConfig.networks,
    ...ethereumConfig.networks,
  },
  contracts: {
    ...baseConfig.contracts,
    ...ethereumConfig.contracts,
  },
})

export default createConfig({
  networks: {
    ...baseConfig.networks,
    ...ethereumConfig.networks,
  },
  contracts: {
    ...baseConfig.contracts,
    ...ethereumConfig.contracts,
  },
});
