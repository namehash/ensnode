import { createConfig } from "ponder";
import { definePonderENSPlugin, mapChainToNetworkConfig } from "../../lib/plugin-helpers";
import { blockConfig } from "../../lib/ponder-helpers";

// base plugin abis
import { BaseRegistrar as base_BaseRegistrar } from "./abis/BaseRegistrar";
import { EarlyAccessRegistrarController as base_EarlyAccessRegistrarController } from "./abis/EARegistrarController";
import { L2Resolver as base_L2Resolver } from "./abis/L2Resolver";
import { RegistrarController as base_RegistrarController } from "./abis/RegistrarController";
import { Registry as base_Registry } from "./abis/Registry";

export const createPlugin = definePonderENSPlugin({
  // uses the 'base' plugin config for deployments
  pluginName: "base" as const,
  // the Registry/Registrar handlers in this plugin manage subdomains of '.base.eth'
  ownedName: "base.eth" as const,
  createConfig: (
    namespace,
    { config: { chain, contracts }, extraContractConfig: { startBlock, endBlock } = {} },
  ) =>
    createConfig({
      networks: { base: mapChainToNetworkConfig(chain) },
      contracts: {
        [namespace("Registry")]: {
          network: "base",
          abi: base_Registry,
          address: contracts.Registry.address,
          ...blockConfig(startBlock, contracts.Registry.startBlock, endBlock),
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
          address: contracts.Resolver.address,
          ...blockConfig(startBlock, contracts.Resolver.startBlock, endBlock),
        },
        [namespace("BaseRegistrar")]: {
          network: "base",
          abi: base_BaseRegistrar,
          address: contracts.BaseRegistrar.address,
          ...blockConfig(startBlock, contracts.BaseRegistrar.startBlock, endBlock),
        },
        [namespace("EARegistrarController")]: {
          network: "base",
          abi: base_EarlyAccessRegistrarController,
          address: contracts.EARegistrarController.address,
          ...blockConfig(startBlock, contracts.EARegistrarController.startBlock, endBlock),
        },
        [namespace("RegistrarController")]: {
          network: "base",
          abi: base_RegistrarController,
          address: contracts.RegistrarController.address,
          ...blockConfig(startBlock, contracts.RegistrarController.startBlock, endBlock),
        },
      },
    }),
  handlers: [
    import("./handlers/Registry"),
    import("./handlers/Registrar"),
    import("./handlers/Resolver"),
  ],
});
