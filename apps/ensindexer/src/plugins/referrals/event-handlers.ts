import config from "@/config";
import { PluginName } from "@ensnode/ensnode-sdk";

import attach_UnwrappedEthRegistrarController from "./handlers/UnwrappedEthRegistrarController";

// conditionally attach event handlers when Ponder executes this file
if (config.plugins.includes(PluginName.Referrals)) {
  attach_UnwrappedEthRegistrarController();
}
