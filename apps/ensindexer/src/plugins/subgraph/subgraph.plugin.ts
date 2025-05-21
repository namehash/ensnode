import { createConfig } from "ponder";

import { default as appConfig } from "@/config/app-config";
import {
  activateHandlers,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";
import { DatasourceName, getENSDeployment } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/utils";

// contruct a unique contract namespace for this plugin
export const pluginName = PluginName.Subgraph;
const namespace = makePluginNamespace(pluginName);

// extract the chain and contract configs for root Datasource in order to build ponder config
const deployment = getENSDeployment(appConfig.ensDeploymentChain);
const { chain, contracts } = deployment[DatasourceName.Root];

export const config = createConfig({
  networks: networksConfigForChain(appConfig, chain.id),
  contracts: {
    [namespace("RegistryOld")]: {
      network: networkConfigForContract(chain, contracts.RegistryOld),
      abi: contracts.Registry.abi,
    },
    [namespace("Registry")]: {
      network: networkConfigForContract(chain, contracts.Registry),
      abi: contracts.Registry.abi,
    },
    [namespace("BaseRegistrar")]: {
      network: networkConfigForContract(chain, contracts.BaseRegistrar),
      abi: contracts.BaseRegistrar.abi,
    },
    [namespace("EthRegistrarControllerOld")]: {
      network: networkConfigForContract(chain, contracts.EthRegistrarControllerOld),
      abi: contracts.EthRegistrarControllerOld.abi,
    },
    [namespace("EthRegistrarController")]: {
      network: networkConfigForContract(chain, contracts.EthRegistrarController),
      abi: contracts.EthRegistrarController.abi,
    },
    [namespace("NameWrapper")]: {
      network: networkConfigForContract(chain, contracts.NameWrapper),
      abi: contracts.NameWrapper.abi,
    },
    Resolver: {
      network: networkConfigForContract(chain, contracts.Resolver),
      abi: contracts.Resolver.abi,
    },
  },
});

export const activate = activateHandlers({
  pluginName,
  namespace,
  handlers: [
    import("./handlers/Registry"),
    import("./handlers/Registrar"),
    import("./handlers/NameWrapper"),
    import("../shared/Resolver"),
  ],
});
