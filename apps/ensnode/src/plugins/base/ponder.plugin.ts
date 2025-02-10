import { createConfig } from "ponder";
import { DEPLOYMENT_CONFIG } from "../../lib/globals";
import {
  activateHandlers,
  createPluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "../../lib/plugin-helpers";

// base plugin abis
import { BaseRegistrar as base_BaseRegistrar } from "./abis/BaseRegistrar";
import { EarlyAccessRegistrarController as base_EarlyAccessRegistrarController } from "./abis/EARegistrarController";
import { L2Resolver as base_L2Resolver } from "./abis/L2Resolver";
import { RegistrarController as base_RegistrarController } from "./abis/RegistrarController";
import { Registry as base_Registry } from "./abis/Registry";

// uses the 'base' plugin config for deployments
export const pluginName = "base" as const;

// the Registry/Registrar handlers in this plugin manage subdomains of '.base.eth'
const ownedName = "base.eth" as const;

const { chain, contracts } = DEPLOYMENT_CONFIG[pluginName];
const namespace = createPluginNamespace(ownedName);

export const config = createConfig({
  networks: networksConfigForChain(chain),
  contracts: {
    [namespace("Registry")]: {
      network: networkConfigForContract(chain, contracts.Registry),
      abi: base_Registry,
    },
    [namespace("Resolver")]: {
      network: networkConfigForContract(chain, contracts.Resolver),
      abi: base_L2Resolver,
      filter: contracts.Resolver.filter,
    },
    [namespace("BaseRegistrar")]: {
      network: networkConfigForContract(chain, contracts.BaseRegistrar),
      abi: base_BaseRegistrar,
    },
    [namespace("EARegistrarController")]: {
      network: networkConfigForContract(chain, contracts.EARegistrarController),
      abi: base_EarlyAccessRegistrarController,
    },
    [namespace("RegistrarController")]: {
      network: networkConfigForContract(chain, contracts.RegistrarController),
      abi: base_RegistrarController,
    },
  },
});

export const activate = activateHandlers({
  ownedName,
  namespace,
  handlers: [
    import("./handlers/Registry"),
    import("./handlers/Registrar"),
    import("./handlers/Resolver"),
  ],
});
