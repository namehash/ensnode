import config from "@/config";

import { PluginName } from "@ensnode/ensnode-sdk";

import attach_SharedMultichainResolverHandlers from "@/plugins/subgraph/shared-handlers/multi-chain/Resolver";

import attach_Registrar from "./handlers/Registrar";
import attach_Registry from "./handlers/Registry";

// conditionally attach event handlers when Ponder executes this file
if (config.plugins.includes(PluginName.Basenames)) {
  attach_Registrar();
  attach_Registry();

  attach_SharedMultichainResolverHandlers();
}
