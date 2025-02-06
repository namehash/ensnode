import { createConfig } from "ponder";
import { DEPLOYMENT_CONFIG, END_BLOCK, START_BLOCK } from "../../lib/globals";
import {
  activateHandlers,
  createPluginNamespace,
  mapChainToNetworkConfig,
} from "../../lib/plugin-helpers";
import { blockConfig } from "../../lib/ponder-helpers";

// base plugin abis
import { BaseRegistrar as base_BaseRegistrar } from "./abis/BaseRegistrar";
import { EarlyAccessRegistrarController as base_EarlyAccessRegistrarController } from "./abis/EARegistrarController";
import { L2Resolver as base_L2Resolver } from "./abis/L2Resolver";
import { RegistrarController as base_RegistrarController } from "./abis/RegistrarController";
import { Registry as base_Registry } from "./abis/Registry";

// uses the 'base' plugin config for deployments
const { chain, contracts } = DEPLOYMENT_CONFIG.base!;

// the Registry/Registrar handlers in this plugin manage subdomains of '.base.eth'
export const ownedName = "base.eth" as const;

const namespace = createPluginNamespace(ownedName);

export const config = createConfig({
  networks: {
    get base() {
      return mapChainToNetworkConfig(chain);
    },
  },
  contracts: {
    [namespace("Registry")]: {
      network: "base",
      abi: base_Registry,
      address: contracts.Registry.address,
      ...blockConfig(START_BLOCK, contracts.Registry.startBlock, END_BLOCK),
    },
    [namespace("Resolver")]: {
      network: "base",
      abi: base_L2Resolver,
      // NOTE: this indexes every event ever emitted that looks like this
      filter: [
        { event: "AddrChanged", args: {} },
        { event: "AddressChanged", args: {} },
        { event: "NameChanged", args: {} },
        { event: "ABIChanged", args: {} },
        { event: "PubkeyChanged", args: {} },
        { event: "TextChanged", args: {} },
        { event: "ContenthashChanged", args: {} },
        { event: "InterfaceChanged", args: {} },
        { event: "VersionChanged", args: {} },
        { event: "DNSRecordChanged", args: {} },
        { event: "DNSRecordDeleted", args: {} },
        { event: "DNSZonehashChanged", args: {} },
      ],
      ...blockConfig(START_BLOCK, contracts.Resolver.startBlock, END_BLOCK),
    },
    [namespace("BaseRegistrar")]: {
      network: "base",
      abi: base_BaseRegistrar,
      address: contracts.BaseRegistrar.address,
      ...blockConfig(START_BLOCK, contracts.BaseRegistrar.startBlock, END_BLOCK),
    },
    [namespace("EARegistrarController")]: {
      network: "base",
      abi: base_EarlyAccessRegistrarController,
      address: contracts.EARegistrarController.address,
      ...blockConfig(START_BLOCK, contracts.EARegistrarController.startBlock, END_BLOCK),
    },
    [namespace("RegistrarController")]: {
      network: "base",
      abi: base_RegistrarController,
      address: contracts.RegistrarController.address,
      ...blockConfig(START_BLOCK, contracts.RegistrarController.startBlock, END_BLOCK),
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
