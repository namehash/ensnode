import { ponder } from "ponder:registry";

import config from "@/config";
import { makeNameWrapperHandlers } from "@/handlers/NameWrapper";
import { namespaceContract } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/ensnode-sdk";
import { getRegistrarManagedName } from "../lib/registrar-helpers";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Lineanames;

  const {
    handleNameWrapped,
    handleNameUnwrapped,
    handleFusesSet,
    handleExpiryExtended,
    handleTransferSingle,
    handleTransferBatch,
  } = makeNameWrapperHandlers({
    // the shared Registrar handlers in this plugin index direct subnames of
    // the name returned from `getRegistrarManagedName` function call
    registrarManagedName: getRegistrarManagedName(config.namespace),
  });

  ponder.on(namespaceContract(pluginName, "NameWrapper:NameWrapped"), handleNameWrapped);
  ponder.on(namespaceContract(pluginName, "NameWrapper:NameUnwrapped"), handleNameUnwrapped);
  ponder.on(namespaceContract(pluginName, "NameWrapper:FusesSet"), handleFusesSet);
  ponder.on(namespaceContract(pluginName, "NameWrapper:ExpiryExtended"), handleExpiryExtended);
  ponder.on(namespaceContract(pluginName, "NameWrapper:TransferSingle"), handleTransferSingle);
  ponder.on(namespaceContract(pluginName, "NameWrapper:TransferBatch"), handleTransferBatch);
}
