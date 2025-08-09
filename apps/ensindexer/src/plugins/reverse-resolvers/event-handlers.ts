import config from "@/config";
import { PluginName } from "@ensnode/ensnode-sdk";

import attach_LegacyReverseResolverHandlers from "./handlers/LegacyReverseResolver";
import attach_StandaloneReverseRegistrarHandlers from "./handlers/StandaloneReverseRegistrar";

// conditionally attach event handlers when Ponder executes this file
if (config.plugins.includes(PluginName.ReverseResolvers)) {
  attach_LegacyReverseResolverHandlers();
  attach_StandaloneReverseRegistrarHandlers();
}
