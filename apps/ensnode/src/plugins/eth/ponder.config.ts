import { definePonderENSPlugin } from "../../lib/plugin-helpers";

export const plugin = definePonderENSPlugin("eth", () => [
  import("./handlers/Registry"),
  import("./handlers/EthRegistrar"),
  import("./handlers/Resolver"),
  import("./handlers/NameWrapper"),
]);
