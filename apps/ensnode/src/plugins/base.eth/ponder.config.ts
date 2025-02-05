import { definePonderENSPlugin } from "../../lib/plugin-helpers";

export const plugin = definePonderENSPlugin("base.eth", () => [
  import("./handlers/Registry"),
  import("./handlers/Registrar"),
  import("./handlers/Resolver"),
]);
