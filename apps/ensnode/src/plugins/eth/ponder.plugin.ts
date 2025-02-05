import { definePonderENSPlugin } from "../../lib/plugin-helpers";

export const plugin = definePonderENSPlugin({
  // uses the 'eth' plugin config for deployments
  pluginName: "eth" as const,
  // the Registry/Registrar handlers in this plugin manage subdomains of '.eth'
  ownedName: "eth" as const,
  handlers: [
    import("./handlers/Registry"),
    import("./handlers/EthRegistrar"),
    import("./handlers/Resolver"),
    import("./handlers/NameWrapper"),
  ],
});
