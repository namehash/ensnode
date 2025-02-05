import DeploymentConfigs from "@namehash/ens-deployments";
import { ContractConfig, createConfig } from "ponder";

import { createPluginNamespace, mapToNetworkConfig } from "../../lib/plugin-helpers";
import { blockConfig } from "../../lib/ponder-helpers";

// TODO: dynamically create config with this as argument
const deployment = DeploymentConfigs["mainnet"];
const { chain, contracts } = deployment["eth"]!;

export const ownedName = "linea.eth";
export const pluginNamespace = createPluginNamespace(ownedName);

// constrain indexing between the following start/end blocks
// https://ponder.sh/0_6/docs/contracts-and-networks#block-range
const START_BLOCK: ContractConfig["startBlock"] = undefined;
const END_BLOCK: ContractConfig["endBlock"] = undefined;

export const config = createConfig({
  networks: {
    get linea() {
      return mapToNetworkConfig(chain);
    },
  },
  contracts: {
    [pluginNamespace("Registry")]: {
      network: "linea",
      ...contracts.Registry,
      ...blockConfig(START_BLOCK, contracts.Registry.startBlock, END_BLOCK),
    },
    [pluginNamespace("Resolver")]: {
      network: "linea",
      ...contracts.Resolver,
      ...blockConfig(START_BLOCK, contracts.Resolver.startBlock, END_BLOCK),
    },
    [pluginNamespace("BaseRegistrar")]: {
      network: "linea",
      ...contracts.BaseRegistrar,
      ...blockConfig(START_BLOCK, contracts.BaseRegistrar.startBlock, END_BLOCK),
    },
    [pluginNamespace("EthRegistrarController")]: {
      network: "linea",
      ...contracts.EthRegistrarController,
      ...blockConfig(START_BLOCK, contracts.EthRegistrarController.startBlock, END_BLOCK),
    },
    [pluginNamespace("NameWrapper")]: {
      network: "linea",
      ...contracts.NameWrapper,
      ...blockConfig(START_BLOCK, contracts.NameWrapper.startBlock, END_BLOCK),
    },
  },
});

export async function activate() {
  const ponderIndexingModules = await Promise.all([
    import("./handlers/Registry"),
    import("./handlers/EthRegistrar"),
    import("./handlers/Resolver"),
    import("./handlers/NameWrapper"),
  ]);

  ponderIndexingModules.map((m) => m.default());
}
