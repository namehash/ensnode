import { createConfig } from "ponder";
import { definePonderENSPlugin, mapChainToNetworkConfig } from "../../lib/plugin-helpers";
import { blockConfig } from "../../lib/ponder-helpers";

export default definePonderENSPlugin({
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
          ...contracts.Registry,
          ...blockConfig(startBlock, contracts.Registry.startBlock, endBlock),
        },
        [namespace("Resolver")]: {
          network: "linea",
          ...contracts.Resolver,
          ...blockConfig(startBlock, contracts.Resolver.startBlock, endBlock),
        },
        [namespace("BaseRegistrar")]: {
          network: "linea",
          ...contracts.BaseRegistrar,
          ...blockConfig(startBlock, contracts.BaseRegistrar.startBlock, endBlock),
        },
        [namespace("EthRegistrarController")]: {
          network: "linea",
          ...contracts.EthRegistrarController,
          ...blockConfig(startBlock, contracts.EthRegistrarController.startBlock, endBlock),
        },
        [namespace("NameWrapper")]: {
          network: "linea",
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
