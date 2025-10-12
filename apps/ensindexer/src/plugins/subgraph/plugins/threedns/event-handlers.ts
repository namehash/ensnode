import config from "@/config";
import { PluginName } from "@ensnode/ensnode-sdk";

import attach_ThreeDNSResolver from "./handlers/ThreeDNSResolver";
import attach_ThreeDNSToken from "./handlers/ThreeDNSToken";

// conditionally attach event handlers when Ponder executes this file
if (config.plugins.includes(PluginName.ThreeDNS)) {
  attach_ThreeDNSResolver();
  attach_ThreeDNSToken();
}
