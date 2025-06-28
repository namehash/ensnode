import { ponder } from "ponder:registry";

import { makeNameWrapperHandlers } from "@/handlers/NameWrapper";
import { makePluginNamespace } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/ensnode-sdk";

/**
 * Attach a set of event handlers for indexing process.
 */
export function attachSubgraphNameWrapperEventHandlers() {
  const pluginName = PluginName.Subgraph;

  const {
    handleExpiryExtended,
    handleFusesSet,
    handleNameUnwrapped,
    handleNameWrapped,
    handleTransferBatch,
    handleTransferSingle,
  } = makeNameWrapperHandlers({
    // the shared Registrar handlers in this plugin index direct subnames of '.eth'
    registrarManagedName: "eth",
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
