import { mainnet } from "viem/chains";
import { isChainIndexingActive } from "../chain";
import { PonderEnsModule } from "../types";

export default {
  get canActivate() {
    return isChainIndexingActive(mainnet.id);
  },

  async activate() {
    const ponderIndexingModules = await Promise.all([
      import("./handlers/Registry"),
      import("./handlers/EthRegistrar"),
      import("./handlers/Resolver"),
    ]);

    for (const { handlerModule } of ponderIndexingModules) {
      handlerModule.attachHandlers();
    }
  },
} as PonderEnsModule;
