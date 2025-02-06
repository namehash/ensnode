import { createConfig, mergeAbis } from "ponder";
import { DEPLOYMENT_CONFIG, END_BLOCK, START_BLOCK } from "../../lib/globals";
import {
  activateHandlers,
  createPluginNamespace,
  mapChainToNetworkConfig,
} from "../../lib/plugin-helpers";
import { blockConfig } from "../../lib/ponder-helpers";

// eth plugin abis
import { BaseRegistrar as eth_BaseRegistrar } from "./abis/BaseRegistrar";
import { EthRegistrarController as eth_EthRegistrarController } from "./abis/EthRegistrarController";
import { EthRegistrarControllerOld as eth_EthRegistrarControllerOld } from "./abis/EthRegistrarControllerOld";
import { LegacyPublicResolver as eth_LegacyPublicResolver } from "./abis/LegacyPublicResolver";
import { NameWrapper as eth_NameWrapper } from "./abis/NameWrapper";
import { Registry as eth_Registry } from "./abis/Registry";
import { Resolver as eth_Resolver } from "./abis/Resolver";

// uses the 'eth' plugin config for deployments
const { chain, contracts } = DEPLOYMENT_CONFIG.eth!;

// the Registry/Registrar handlers in this plugin manage subdomains of '.eth'
export const ownedName = "eth" as const;

const namespace = createPluginNamespace(ownedName);

export const config = createConfig({
  networks: {
    get mainnet() {
      return mapChainToNetworkConfig(chain);
    },
  },
  contracts: {
    [namespace("RegistryOld")]: {
      network: "mainnet",
      abi: eth_Registry,
      address: contracts.RegistryOld.address,
      ...blockConfig(START_BLOCK, contracts.RegistryOld.startBlock, END_BLOCK),
    },
    [namespace("Registry")]: {
      network: "mainnet",
      abi: eth_Registry,
      address: contracts.Registry.address,
      ...blockConfig(START_BLOCK, contracts.Registry.startBlock, END_BLOCK),
    },
    [namespace("Resolver")]: {
      network: "mainnet",
      abi: mergeAbis([eth_LegacyPublicResolver, eth_Resolver]),
      // NOTE: this indexes every event ever emitted that looks like this
      filter: [
        { event: "AddrChanged", args: {} },
        { event: "AddressChanged", args: {} },
        { event: "NameChanged", args: {} },
        { event: "ABIChanged", args: {} },
        { event: "PubkeyChanged", args: {} },
        {
          event: "TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
          args: {},
        },
        {
          event:
            "TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
          args: {},
        },
        { event: "ContenthashChanged", args: {} },
        { event: "InterfaceChanged", args: {} },
        { event: "AuthorisationChanged", args: {} },
        { event: "VersionChanged", args: {} },
        { event: "DNSRecordChanged", args: {} },
        { event: "DNSRecordDeleted", args: {} },
        { event: "DNSZonehashChanged", args: {} },
      ],
      ...blockConfig(START_BLOCK, contracts.Resolver.startBlock, END_BLOCK),
    },
    [namespace("BaseRegistrar")]: {
      network: "mainnet",
      abi: eth_BaseRegistrar,
      address: contracts.BaseRegistrar.address,
      ...blockConfig(START_BLOCK, contracts.BaseRegistrar.startBlock, END_BLOCK),
    },
    [namespace("EthRegistrarControllerOld")]: {
      network: "mainnet",
      abi: eth_EthRegistrarControllerOld,
      address: contracts.EthRegistrarControllerOld.address,
      ...blockConfig(START_BLOCK, contracts.EthRegistrarControllerOld.startBlock, END_BLOCK),
    },
    [namespace("EthRegistrarController")]: {
      network: "mainnet",
      abi: eth_EthRegistrarController,
      address: contracts.EthRegistrarController.address,
      ...blockConfig(START_BLOCK, contracts.EthRegistrarController.startBlock, END_BLOCK),
    },
    [namespace("NameWrapper")]: {
      network: "mainnet",
      abi: eth_NameWrapper,
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
