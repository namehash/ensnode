import config from "@/config";
import { PluginName } from "@ensnode/ensnode-sdk";

import attach_BaseRegistrars from "./handlers/BaseRegistrars";
import attach_NameWrapper from "./handlers/NameWrapper";
import attach_Seaport from "./handlers/Seaport";
import attach_ThreeDNSToken from "./handlers/ThreeDNSToken";

// conditionally attach event handlers when Ponder executes this file
if (config.plugins.includes(PluginName.TokenScope)) {
  attach_BaseRegistrars();
  attach_NameWrapper();
  attach_ThreeDNSToken();
  attach_Seaport();
}
