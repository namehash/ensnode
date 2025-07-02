import config from "@/config";
import { PluginName } from "@ensnode/ensnode-sdk";

import attach_Registrar from "./handlers/Registrar";
import attach_Registry from "./handlers/Registry";

import attach_SharedResolverHandlers from "@/plugins/multi-network/Resolver";

// conditionally attach event handlers when Ponder executes this file
if (config.plugins.includes(PluginName.Basenames)) {
  attach_Registrar();
  attach_Registry();

  attach_SharedResolverHandlers();
}
