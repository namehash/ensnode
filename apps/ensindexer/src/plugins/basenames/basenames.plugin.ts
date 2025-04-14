import { createConfig } from "ponder";

import { DEPLOYMENT_CONFIG } from "@/lib/globals";
import {
  activateHandlers,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/utils";

/**
 * The Basenames plugin describes indexing behavior for the Basenames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
 */
export const pluginName = PluginName.Basenames;

const { chain, contracts } = DEPLOYMENT_CONFIG[pluginName];
const namespace = makePluginNamespace(pluginName);

export const config = createConfig({
  networks: networksConfigForChain(chain),
  contracts: {
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
    [namespace("EARegistrarController")]: {
      network: networkConfigForContract(chain, contracts.EARegistrarController),
      abi: contracts.EARegistrarController.abi,
    },
    [namespace("RegistrarController")]: {
      network: networkConfigForContract(chain, contracts.RegistrarController),
      abi: contracts.RegistrarController.abi,
    },
  },
});

export const activate = activateHandlers({
  pluginName,
  // the shared Registrar handler in this plugin indexes direct subnames of '.base.eth'
  registrarManagedName: "base.eth",
  namespace,
  handlers: [
    import("./handlers/Registry"),
    import("./handlers/Registrar"),
    import("./handlers/Resolver"),
  ],
});
