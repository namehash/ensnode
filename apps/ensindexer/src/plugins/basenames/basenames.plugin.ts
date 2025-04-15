import { createConfig } from "ponder";

import { MERGED_ENS_DEPLOYMENT } from "@/lib/globals";
import {
  activateHandlers,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";
import { DatasourceName } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/utils";

/**
 * The Basenames plugin describes indexing behavior for the Basenames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
 */
export const pluginName = PluginName.Basenames;
export const deps = [DatasourceName.Basenames];

// extract the chain and contract configs for Basenames Datasource in order to build ponder config
const { chain, contracts } = MERGED_ENS_DEPLOYMENT[DatasourceName.Basenames];
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
