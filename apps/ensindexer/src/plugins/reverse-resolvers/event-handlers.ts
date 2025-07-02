import config from "@/config";
import { PluginName } from "@ensnode/ensnode-sdk";

import attachReverseResolverHandlers from "@/plugins/multi-network/ReverseResolver";

// conditionally attach event handlers when Ponder executes this file
if (config.plugins.includes(PluginName.ReverseResolvers)) {
  attachReverseResolverHandlers();
}
