import { createConfig } from "ponder";

import { DEPLOYMENT_CONFIG } from "@/lib/globals";
import {
  activateHandlers,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";
import { DatasourceName } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/utils";

/**
 * The Subgraph plugin describes indexing behavior for the 'Root' Datasource, in alignment with the
 * legacy ENS Subgraph indexing logic.
 */
export const pluginName = PluginName.Subgraph;
export const deps = [DatasourceName.Root];

const { chain, contracts } = DEPLOYMENT_CONFIG[DatasourceName.Root];
const namespace = makePluginNamespace(pluginName);

export const config = createConfig({
  networks: networksConfigForChain(chain),
  contracts: {
    [namespace("RegistryOld")]: {
      network: networkConfigForContract(chain, contracts.RegistryOld),
      abi: contracts.Registry.abi,
    },
    [namespace("Registry")]: {
      network: networkConfigForContract(chain, contracts.Registry),
      abi: contracts.Registry.abi,
    },
    [namespace("Resolver")]: {
      network: networkConfigForContract(chain, contracts.Resolver),
      abi: contracts.Resolver.abi,
      // index Resolver by event signatures, not address
      filter: contracts.Resolver.filter,
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
  },
});

export const activate = activateHandlers({
  pluginName,
  // the shared Registrar handler in this plugin indexes direct subnames of '.eth'
  registrarManagedName: "eth",
  namespace,
  handlers: [
    import("./handlers/Registry"),
    import("./handlers/Registrar"),
    import("./handlers/Resolver"),
    import("./handlers/NameWrapper"),
  ],
});
