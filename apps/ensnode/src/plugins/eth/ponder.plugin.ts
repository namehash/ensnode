import { createConfig } from "ponder";
import { definePonderENSPlugin, mapChainToNetworkConfig } from "../../lib/plugin-helpers";
import { blockConfig } from "../../lib/ponder-helpers";

export default definePonderENSPlugin({
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
          ...contracts.RegistryOld,
          ...blockConfig(startBlock, contracts.RegistryOld.startBlock, endBlock),
        },
        [namespace("Registry")]: {
          network: "mainnet",
          ...contracts.Registry,
          ...blockConfig(startBlock, contracts.Registry.startBlock, endBlock),
        },
        [namespace("Resolver")]: {
          network: "mainnet",
          ...contracts.Resolver,
          ...blockConfig(startBlock, contracts.Resolver.startBlock, endBlock),
        },
        [namespace("BaseRegistrar")]: {
          network: "mainnet",
          ...contracts.BaseRegistrar,
          ...blockConfig(startBlock, contracts.BaseRegistrar.startBlock, endBlock),
        },
        [namespace("EthRegistrarControllerOld")]: {
          network: "mainnet",
          ...contracts.EthRegistrarControllerOld,
          ...blockConfig(startBlock, contracts.EthRegistrarControllerOld.startBlock, endBlock),
        },
        [namespace("EthRegistrarController")]: {
          network: "mainnet",
          ...contracts.EthRegistrarController,
          ...blockConfig(startBlock, contracts.EthRegistrarController.startBlock, endBlock),
        },
        [namespace("NameWrapper")]: {
          network: "mainnet",
          ...contracts.NameWrapper,
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
