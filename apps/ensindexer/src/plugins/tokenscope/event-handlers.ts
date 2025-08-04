import config from "@/config";
import { PluginName } from "@ensnode/ensnode-sdk";

import attach_Seaport from "./handlers/Seaport";

// conditionally attach event handlers when Ponder executes this file
if (config.plugins.includes(PluginName.TokenScope)) {
  attach_Seaport();
}
