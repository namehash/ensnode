import config from "@/config";
import { PluginName } from "@ensnode/ensnode-sdk";

import attach_LegacyReverseResolverHandlers from "./handlers/LegacyReverseResolver";
import attach_ResolverHandlers from "./handlers/Resolver";
import attach_StandaloneReverseRegistrarHandlers from "./handlers/StandaloneReverseRegistrar";

// conditionally attach event handlers when Ponder executes this file
if (config.plugins.includes(PluginName.ProtocolAcceleration)) {
  attach_ResolverHandlers();
  attach_LegacyReverseResolverHandlers();
  attach_StandaloneReverseRegistrarHandlers();
}
