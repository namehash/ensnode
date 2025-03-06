import { createConfig } from "ponder";
import { DEPLOYMENT_CONFIG } from "../../lib/globals";
import {
  activateHandlers,
  createPluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "../../lib/plugin-helpers";

export const pluginName = "ens-v2" as const;

const { chain, contracts } = DEPLOYMENT_CONFIG[pluginName];
const namespace = createPluginNamespace(pluginName);

export const config = createConfig({
  networks: networksConfigForChain(chain),
  contracts: {
    [namespace("EthRegistry")]: {
      network: networkConfigForContract(chain, contracts.EthRegistry),
      abi: contracts.EthRegistry.abi,
    },
    [namespace("RegistryDatastore")]: {
      network: networkConfigForContract(chain, contracts.RegistryDatastore),
      abi: contracts.RegistryDatastore.abi,
    },
    [namespace("RootRegistry")]: {
      network: networkConfigForContract(chain, contracts.RootRegistry),
      abi: contracts.RootRegistry.abi,
    },
    [namespace("OwnedResolver")]: {
      network: networkConfigForContract(chain, contracts.OwnedResolver),
      abi: contracts.OwnedResolver.abi,
    },
  },
});

export const activate = activateHandlers({
  ownedName: pluginName,
  namespace,
  handlers: [
    import("./handlers/EthRegistry"),
    import("./handlers/RegistryDatastore"),
    import("./handlers/RootRegistry"),
    import("./handlers/OwnedResolver"),
  ],
});
