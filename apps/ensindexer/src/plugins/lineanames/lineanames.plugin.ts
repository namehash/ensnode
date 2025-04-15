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
 * The Lineanames plugin describes indexing behavior for the Lineanames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
 */
export const pluginName = PluginName.Lineanames;
export const requiredDatasources = [DatasourceName.Lineanames];

// extract the chain and contract configs for Lineanames Datasource in order to build ponder config
const { chain, contracts } = MERGED_ENS_DEPLOYMENT[DatasourceName.Lineanames];
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
  // the shared Registrar handler in this plugin indexes direct subnames of '.linea.eth'
  registrarManagedName: "linea.eth",
  namespace,
  handlers: [
    import("./handlers/Registry"),
    import("./handlers/Registrar"),
    import("./handlers/Resolver"),
    import("./handlers/NameWrapper"),
  ],
});
