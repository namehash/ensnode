import { createConfig } from "ponder";
import { definePonderENSPlugin, mapChainToNetworkConfig } from "../../lib/plugin-helpers";
import { blockConfig } from "../../lib/ponder-helpers";

// linea plugin abis
import { BaseRegistrar as linea_BaseRegistrar } from "./abis/BaseRegistrar";
import { EthRegistrarController as linea_EthRegistrarController } from "./abis/EthRegistrarController";
import { NameWrapper as linea_NameWrapper } from "./abis/NameWrapper";
import { Registry as linea_Registry } from "./abis/Registry";
import { Resolver as linea_Resolver } from "./abis/Resolver";

export const createPlugin = definePonderENSPlugin({
  // uses the 'linea' plugin config for deployments
  pluginName: "linea" as const,
  // the Registry/Registrar handlers in this plugin manage subdomains of '.linea.eth'
  ownedName: "linea.eth" as const,
  createConfig: (
    namespace,
    { config: { chain, contracts }, extraContractConfig: { startBlock, endBlock } = {} },
  ) =>
    createConfig({
      networks: { linea: mapChainToNetworkConfig(chain) },
      contracts: {
        [namespace("Registry")]: {
          network: "linea",
          abi: linea_Registry,
          address: contracts.Registry.address,
          // ...blockConfig(startBlock, contracts.Registry.startBlock, endBlock),
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
          address: contracts.Resolver.address,
          ...blockConfig(startBlock, contracts.Resolver.startBlock, endBlock),
        },
        [namespace("BaseRegistrar")]: {
          network: "linea",
          abi: linea_BaseRegistrar,
          address: contracts.BaseRegistrar.address,
          ...blockConfig(startBlock, contracts.BaseRegistrar.startBlock, endBlock),
        },
        [namespace("EthRegistrarController")]: {
          network: "linea",
          abi: linea_EthRegistrarController,
          address: contracts.EthRegistrarController.address,
          ...blockConfig(startBlock, contracts.EthRegistrarController.startBlock, endBlock),
        },
        [namespace("NameWrapper")]: {
          network: "linea",
          abi: linea_NameWrapper,
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
