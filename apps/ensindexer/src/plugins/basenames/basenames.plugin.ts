import { createConfig } from "ponder";

import { default as appConfig } from "@/config/app-config";
import { MERGED_ENS_DEPLOYMENT } from "@/lib/globals";
import {
  activateHandlers,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
  validateContractConfigs,
} from "@/lib/plugin-helpers";
import { DatasourceName } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/utils";

/**
 * The Basenames plugin describes indexing behavior for the Basenames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
 */
export const pluginName = PluginName.Basenames;
export const requiredDatasources = [DatasourceName.Basenames];

// extract the chain and contract configs for Basenames Datasource in order to build ponder config
const { chain, contracts } = MERGED_ENS_DEPLOYMENT[DatasourceName.Basenames];
const namespace = makePluginNamespace(pluginName);

// validate runtime contract config
validateContractConfigs(pluginName, contracts);

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
    [namespace("EARegistrarController")]: {
      network: networkConfigForContract(chain, contracts.EARegistrarController),
      abi: contracts.EARegistrarController.abi,
    },
    [namespace("RegistrarController")]: {
      network: networkConfigForContract(chain, contracts.RegistrarController),
      abi: contracts.RegistrarController.abi,
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
    import("../shared/Resolver"),
  ],
});
