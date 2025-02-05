import { DeploymentConfigs } from "@namehash/ens-deployments";
import { type ContractConfig, createConfig } from "ponder";

import { createPluginNamespace, mapToNetworkConfig } from "../../lib/plugin-helpers";
import { blockConfig } from "../../lib/ponder-helpers";

// TODO: dynamically create config with this as argument
const deployment = DeploymentConfigs["mainnet"];
const { chain, contracts } = deployment["base"]!;

export const ownedName = "base.eth" as const;
export const pluginNamespace = createPluginNamespace(ownedName);

// constrain indexing between the following start/end blocks
// https://ponder.sh/0_6/docs/contracts-and-networks#block-range
const START_BLOCK: ContractConfig["startBlock"] = undefined;
const END_BLOCK: ContractConfig["endBlock"] = undefined;

export const config = createConfig({
  networks: {
    get base() {
      return mapToNetworkConfig(chain);
    },
  },
  contracts: {
    [pluginNamespace("Registry")]: {
      network: "base",
      ...contracts.Registry,
      ...blockConfig(START_BLOCK, contracts.Registry.startBlock, END_BLOCK),
    },
    [pluginNamespace("Resolver")]: {
      network: "base",
      ...contracts.Resolver,
      ...blockConfig(START_BLOCK, contracts.Resolver.startBlock, END_BLOCK),
    },
    [pluginNamespace("BaseRegistrar")]: {
      network: "base",
      ...contracts.BaseRegistrar,
      ...blockConfig(START_BLOCK, contracts.BaseRegistrar.startBlock, END_BLOCK),
    },
    [pluginNamespace("EARegistrarController")]: {
      network: "base",
      ...contracts.EARegistrarController,
      ...blockConfig(START_BLOCK, contracts.EARegistrarController.startBlock, END_BLOCK),
    },
    [pluginNamespace("RegistrarController")]: {
      network: "base",
      ...contracts.RegistrarController,
      ...blockConfig(START_BLOCK, contracts.RegistrarController.startBlock, END_BLOCK),
    },
  },
});

export async function activate() {
  const ponderIndexingModules = await Promise.all([
    import("./handlers/Registry"),
    import("./handlers/Registrar"),
    import("./handlers/Resolver"),
  ]);

  ponderIndexingModules.map((m) => m.default());
}
