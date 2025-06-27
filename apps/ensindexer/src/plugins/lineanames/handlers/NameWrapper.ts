import { ponder } from "ponder:registry";

import config from "@/config";
import { makeNameWrapperHandlers } from "@/handlers/NameWrapper";
import { makePluginNamespace } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/ensnode-sdk";
import { getRegistrarManagedName } from "../lib/registrar-helpers";

/**
 * Attach a set of event handlers for indexing process.
 */
export function attachLineanamesNameWrapperEventHandlers() {
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

  // create a namespace for the plugin events to avoid conflicts with other plugins
  const ns = makePluginNamespace(pluginName);

  ponder.on(ns("NameWrapper:NameWrapped"), handleNameWrapped);
  ponder.on(ns("NameWrapper:NameUnwrapped"), handleNameUnwrapped);
  ponder.on(ns("NameWrapper:FusesSet"), handleFusesSet);
  ponder.on(ns("NameWrapper:ExpiryExtended"), handleExpiryExtended);
  ponder.on(ns("NameWrapper:TransferSingle"), handleTransferSingle);
  ponder.on(ns("NameWrapper:TransferBatch"), handleTransferBatch);
}
