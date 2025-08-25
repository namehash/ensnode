import { ponder } from "ponder:registry";

import { PluginName } from "@ensnode/ensnode-sdk";

import { handleOrderFulfilled } from "@/handlers/Seaport";
import { namespaceContract } from "@/lib/plugin-helpers";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.TokenScope;

  ponder.on(namespaceContract(pluginName, "Seaport:OrderFulfilled"), handleOrderFulfilled);
}
