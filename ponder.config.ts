import { createConfig } from "ponder";
import { config as baseConfig } from "./src/ponder-ens-plugins/base/ponder.config";
import { config as ethereumConfig } from "./src/ponder-ens-plugins/ethereum/ponder.config";

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
