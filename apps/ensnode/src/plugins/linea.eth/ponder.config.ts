import { definePonderENSPlugin } from "../../lib/plugin-helpers";

export const plugin = definePonderENSPlugin("linea.eth", () => [
  import("./handlers/Registry"),
  import("./handlers/EthRegistrar"),
  import("./handlers/Resolver"),
  import("./handlers/NameWrapper"),
]);
