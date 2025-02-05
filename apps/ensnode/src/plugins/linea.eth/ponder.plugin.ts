import { definePonderENSPlugin } from "../../lib/plugin-helpers";

export const plugin = definePonderENSPlugin({
  // uses the 'linea' plugin config for deployments
  pluginName: "linea" as const,
  // the Registry/Registrar handlers in this plugin manage subdomains of '.linea.eth'
  ownedName: "linea.eth" as const,
  handlers: [
    import("./handlers/Registry"),
    import("./handlers/EthRegistrar"),
    import("./handlers/Resolver"),
    import("./handlers/NameWrapper"),
  ],
});
