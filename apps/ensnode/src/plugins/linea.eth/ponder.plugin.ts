import { createConfig } from "ponder";
import { DEPLOYMENT_CONFIG, END_BLOCK, START_BLOCK } from "../../lib/globals";
import {
  activateHandlers,
  createPluginNamespace,
  mapChainToNetworkConfig,
} from "../../lib/plugin-helpers";
import { blockConfig } from "../../lib/ponder-helpers";

// linea plugin abis
import { BaseRegistrar as linea_BaseRegistrar } from "./abis/BaseRegistrar";
import { EthRegistrarController as linea_EthRegistrarController } from "./abis/EthRegistrarController";
import { NameWrapper as linea_NameWrapper } from "./abis/NameWrapper";
import { Registry as linea_Registry } from "./abis/Registry";
import { Resolver as linea_Resolver } from "./abis/Resolver";

// uses the 'linea' plugin config for deployments
const { chain, contracts } = DEPLOYMENT_CONFIG.linea!;

// the Registry/Registrar handlers in this plugin manage subdomains of '.linea.eth'
export const ownedName = "linea.eth" as const;

const namespace = createPluginNamespace(ownedName);

export const config = createConfig({
  networks: {
    get linea() {
      return mapChainToNetworkConfig(chain);
    },
  },
  contracts: {
    [namespace("Registry")]: {
      network: "linea",
      abi: linea_Registry,
      address: contracts.Registry.address,
      ...blockConfig(START_BLOCK, contracts.Registry.startBlock, END_BLOCK),
    },
    [namespace("Resolver")]: {
      network: "linea",
      abi: linea_Resolver,
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
      network: "linea",
      abi: linea_BaseRegistrar,
      address: contracts.BaseRegistrar.address,
      ...blockConfig(START_BLOCK, contracts.BaseRegistrar.startBlock, END_BLOCK),
    },
    [namespace("EthRegistrarController")]: {
      network: "linea",
      abi: linea_EthRegistrarController,
      address: contracts.EthRegistrarController.address,
      ...blockConfig(START_BLOCK, contracts.EthRegistrarController.startBlock, END_BLOCK),
    },
    [namespace("NameWrapper")]: {
      network: "linea",
      abi: linea_NameWrapper,
      address: contracts.NameWrapper.address,
      ...blockConfig(START_BLOCK, contracts.NameWrapper.startBlock, END_BLOCK),
    },
  },
});

export const activate = activateHandlers({
  ownedName,
  namespace,
  handlers: [
    import("./handlers/Registry"),
    import("./handlers/EthRegistrar"),
    import("./handlers/Resolver"),
    import("./handlers/NameWrapper"),
  ],
});
