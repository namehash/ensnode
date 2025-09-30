import config from "@/config";
import { PluginName } from "@ensnode/ensnode-sdk";

import attach_RegistryHandlers from "./handlers/Registry";
import attach_ResolverHandlers from "./handlers/Resolver";
import attach_StandaloneReverseRegistrarHandlers from "./handlers/StandaloneReverseRegistrar";
import attach_ThreeDNSTokenHandlers from "./handlers/ThreeDNSToken";

// conditionally attach event handlers when Ponder executes this file
if (config.plugins.includes(PluginName.ProtocolAcceleration)) {
  attach_RegistryHandlers();
  attach_ResolverHandlers();
  attach_StandaloneReverseRegistrarHandlers();
  attach_ThreeDNSTokenHandlers();
}
