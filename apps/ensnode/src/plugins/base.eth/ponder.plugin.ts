import { createConfig } from "ponder";
import { definePonderENSPlugin, mapChainToNetworkConfig } from "../../lib/plugin-helpers";
import { blockConfig } from "../../lib/ponder-helpers";

export default definePonderENSPlugin({
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
          ...contracts.Registry,
          ...blockConfig(startBlock, contracts.Registry.startBlock, endBlock),
        },
        [namespace("Resolver")]: {
          network: "base",
          ...contracts.Resolver,
          ...blockConfig(startBlock, contracts.Resolver.startBlock, endBlock),
        },
        [namespace("BaseRegistrar")]: {
          network: "base",
          ...contracts.BaseRegistrar,
          ...blockConfig(startBlock, contracts.BaseRegistrar.startBlock, endBlock),
        },
        [namespace("EARegistrarController")]: {
          network: "base",
          ...contracts.EARegistrarController,
          ...blockConfig(startBlock, contracts.EARegistrarController.startBlock, endBlock),
        },
        [namespace("RegistrarController")]: {
          network: "base",
          ...contracts.RegistrarController,
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
