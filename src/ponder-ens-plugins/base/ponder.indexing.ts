import { base } from "viem/chains";
import { isChainIndexingActive } from "../chain";
import { PonderEnsModule } from "../types";

export default {
  get canActivate() {
    return isChainIndexingActive(base.id);
  },

  async activate() {
    const ponderIndexingModules = await Promise.all([
      import("./handlers/Registry"),
      import("./handlers/Registrar"),
      import("./handlers/Resolver"),
    ]);

    for (const { handlerModule } of ponderIndexingModules) {
      handlerModule.attachHandlers();
    }
  },
} as PonderEnsModule;
