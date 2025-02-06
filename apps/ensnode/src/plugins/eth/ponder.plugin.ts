import { createConfig, mergeAbis } from "ponder";
import { definePonderENSPlugin, mapChainToNetworkConfig } from "../../lib/plugin-helpers";
import { blockConfig } from "../../lib/ponder-helpers";

// eth plugin abis
import { BaseRegistrar as eth_BaseRegistrar } from "./abis/BaseRegistrar";
import { EthRegistrarController as eth_EthRegistrarController } from "./abis/EthRegistrarController";
import { EthRegistrarControllerOld as eth_EthRegistrarControllerOld } from "./abis/EthRegistrarControllerOld";
import { LegacyPublicResolver as eth_LegacyPublicResolver } from "./abis/LegacyPublicResolver";
import { NameWrapper as eth_NameWrapper } from "./abis/NameWrapper";
import { Registry as eth_Registry } from "./abis/Registry";
import { Resolver as eth_Resolver } from "./abis/Resolver";

export const createPlugin = definePonderENSPlugin({
  // uses the 'eth' plugin config for deployments
  pluginName: "eth" as const,
  // the Registry/Registrar handlers in this plugin manage subdomains of '.eth'
  ownedName: "eth" as const,
  createConfig: (
    namespace,
    { config: { chain, contracts }, extraContractConfig: { startBlock, endBlock } = {} },
  ) =>
    createConfig({
      networks: { mainnet: mapChainToNetworkConfig(chain) },
      contracts: {
        [namespace("RegistryOld")]: {
          network: "mainnet",
          abi: eth_Registry,
          address: contracts.RegistryOld.address,
          ...blockConfig(startBlock, contracts.RegistryOld.startBlock, endBlock),
        },
        [namespace("Registry")]: {
          network: "mainnet",
          abi: eth_Registry,
          address: contracts.Registry.address,
          ...blockConfig(startBlock, contracts.Registry.startBlock, endBlock),
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
          // address: contracts.Resolver.address,
          ...blockConfig(startBlock, contracts.Resolver.startBlock, endBlock),
        },
        [namespace("BaseRegistrar")]: {
          network: "mainnet",
          abi: eth_BaseRegistrar,
          address: contracts.BaseRegistrar.address,
          ...blockConfig(startBlock, contracts.BaseRegistrar.startBlock, endBlock),
        },
        [namespace("EthRegistrarControllerOld")]: {
          network: "mainnet",
          abi: eth_EthRegistrarControllerOld,
          address: contracts.EthRegistrarControllerOld.address,
          ...blockConfig(startBlock, contracts.EthRegistrarControllerOld.startBlock, endBlock),
        },
        [namespace("EthRegistrarController")]: {
          network: "mainnet",
          abi: eth_EthRegistrarController,
          address: contracts.EthRegistrarController.address,
          ...blockConfig(startBlock, contracts.EthRegistrarController.startBlock, endBlock),
        },
        [namespace("NameWrapper")]: {
          network: "mainnet",
          abi: eth_NameWrapper,
          address: contracts.NameWrapper.address,
          ...blockConfig(startBlock, contracts.NameWrapper.startBlock, endBlock),
        },
      },
    }),
  handlers: [
    import("./handlers/Registry"),
    import("./handlers/EthRegistrar"),
    import("./handlers/Resolver"),
    import("./handlers/NameWrapper"),
  ],
});
