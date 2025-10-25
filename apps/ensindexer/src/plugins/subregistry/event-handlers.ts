import config from "@/config";
import { PluginName } from "@ensnode/ensnode-sdk";

import attach_BaseEth_Registrars from "./by-owned-name/base.eth/handlers/BaseEth_Registrar";
import attach_BaseEth_RegistrarControllers from "./by-owned-name/base.eth/handlers/BaseEth_RegistrarController";

import attach_Eth_Registrars from "./by-owned-name/eth/handlers/Eth_Registrar";
import attach_Eth_RegistrarControllers from "./by-owned-name/eth/handlers/Eth_RegistrarController";

import attach_LineaEth_Registrars from "./by-owned-name/linea.eth/handlers/LineaEth_Registrar";
import attach_LineaEth_RegistrarControllers from "./by-owned-name/linea.eth/handlers/LineaEth_RegistrarController";

// conditionally attach event handlers when Ponder executes this file
if (config.plugins.includes(PluginName.Subregistry)) {
  attach_Eth_Registrars();
  attach_Eth_RegistrarControllers();

  attach_BaseEth_Registrars();
  attach_BaseEth_RegistrarControllers();

  attach_LineaEth_Registrars();
  attach_LineaEth_RegistrarControllers();
}
