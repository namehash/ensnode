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
export const pluginName = PluginName.Lineanames;
const namespace = makePluginNamespace(pluginName);

// extract the chain and contract configs for Lineanames Datasource in order to build ponder config
const deployment = getENSDeployment(appConfig.ensDeploymentChain);
const { chain, contracts } = deployment[DatasourceName.Lineanames];

export const config = createConfig({
  networks: networksConfigForChain(appConfig, chain.id),
  contracts: {
    [namespace("Registry")]: {
      network: networkConfigForContract(chain, contracts.Registry),
      abi: contracts.Registry.abi,
    },
    [namespace("BaseRegistrar")]: {
      network: networkConfigForContract(chain, contracts.BaseRegistrar),
      abi: contracts.BaseRegistrar.abi,
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
