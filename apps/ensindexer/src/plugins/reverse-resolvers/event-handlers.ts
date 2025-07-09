import config from "@/config";
import { PluginName } from "@ensnode/ensnode-sdk";

import attach_SharedMultichainReverseResolverHandlers from "@/handlers/multi-chain/ReverseResolver";

// conditionally attach event handlers when Ponder executes this file
if (config.plugins.includes(PluginName.ReverseResolvers)) {
  attach_SharedMultichainReverseResolverHandlers();
}
