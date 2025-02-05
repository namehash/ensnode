import DeploymentConfigs from "@namehash/ens-deployments";
import { ContractConfig, createConfig } from "ponder";

import { createPluginNamespace, mapToNetworkConfig } from "../../lib/plugin-helpers";
import { blockConfig } from "../../lib/ponder-helpers";

// TODO: dynamically create config with this as argument
const deployment = DeploymentConfigs["mainnet"];
const { chain, contracts } = deployment["eth"]!;

export const ownedName = "eth" as const;
export const pluginNamespace = createPluginNamespace(ownedName);

// constrain indexing between the following start/end blocks
// https://ponder.sh/0_6/docs/contracts-and-networks#block-range
const START_BLOCK: ContractConfig["startBlock"] = undefined;
const END_BLOCK: ContractConfig["endBlock"] = undefined;

export const config = createConfig({
  networks: {
    get mainnet() {
      return mapToNetworkConfig(chain);
    },
  },
  contracts: {
    [pluginNamespace("RegistryOld")]: {
      network: "mainnet",
      ...contracts.Registry,
      ...blockConfig(START_BLOCK, contracts.Registry.startBlock, END_BLOCK),
    },
    [pluginNamespace("Registry")]: {
      network: "mainnet",
      ...contracts.Registry,
      ...blockConfig(START_BLOCK, contracts.Registry.startBlock, END_BLOCK),
    },
    [pluginNamespace("Resolver")]: {
      network: "mainnet",
      ...contracts.Resolver,
      ...blockConfig(START_BLOCK, contracts.Resolver.startBlock, END_BLOCK),
    },
    [pluginNamespace("BaseRegistrar")]: {
      network: "mainnet",
      ...contracts.BaseRegistrar,
      ...blockConfig(START_BLOCK, contracts.BaseRegistrar.startBlock, END_BLOCK),
    },
    [pluginNamespace("EthRegistrarControllerOld")]: {
      network: "mainnet",
      ...contracts.EthRegistrarControllerOld,
      ...blockConfig(START_BLOCK, contracts.EthRegistrarControllerOld.startBlock, END_BLOCK),
    },
    [pluginNamespace("EthRegistrarController")]: {
      network: "mainnet",
      ...contracts.EthRegistrarController,
      ...blockConfig(START_BLOCK, contracts.EthRegistrarController.startBlock, END_BLOCK),
    },
    [pluginNamespace("NameWrapper")]: {
      network: "mainnet",
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
