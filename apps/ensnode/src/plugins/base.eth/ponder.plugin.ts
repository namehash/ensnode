import { definePonderENSPlugin } from "../../lib/plugin-helpers";

export const plugin = definePonderENSPlugin({
  // uses the 'base' plugin config for deployments
  pluginName: "base" as const,
  // the Registry/Registrar handlers in this plugin manage subdomains of '.base.eth'
  ownedName: "base.eth" as const,
  handlers: [
    import("./handlers/Registry"),
    import("./handlers/Registrar"),
    import("./handlers/Resolver"),
  ],
});
