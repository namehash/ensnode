import { ponder } from "ponder:registry";

import { makeNameWrapperHandlers } from "@/handlers/NameWrapper";
import { namespaceContract } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/ensnode-sdk";

/**
 * Registers event handlers with Ponder.
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

  ponder.on(namespaceContract(pluginName, "NameWrapper:NameWrapped"), handleNameWrapped);
  ponder.on(namespaceContract(pluginName, "NameWrapper:NameUnwrapped"), handleNameUnwrapped);
  ponder.on(namespaceContract(pluginName, "NameWrapper:FusesSet"), handleFusesSet);
  ponder.on(namespaceContract(pluginName, "NameWrapper:ExpiryExtended"), handleExpiryExtended);
  ponder.on(namespaceContract(pluginName, "NameWrapper:TransferSingle"), handleTransferSingle);
  ponder.on(namespaceContract(pluginName, "NameWrapper:TransferBatch"), handleTransferBatch);
}
