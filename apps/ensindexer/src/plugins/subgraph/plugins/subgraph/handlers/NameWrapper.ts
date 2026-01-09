import { ponder } from "ponder:registry";

import { PluginName } from "@ensnode/ensnode-sdk";

import { namespaceContract } from "@/lib/plugin-helpers";
import { makeNameWrapperHandlers } from "@/plugins/subgraph/shared-handlers/NameWrapper";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Subgraph;

  const {
    handleExpiryExtended,
    handleFusesSet,
    handleNameUnwrapped,
    handleNameWrapped,
    handleTransferBatch,
    handleTransferSingle,
  } = makeNameWrapperHandlers();

  ponder.on(namespaceContract(pluginName, "NameWrapper:NameWrapped"), handleNameWrapped);
  ponder.on(namespaceContract(pluginName, "NameWrapper:NameUnwrapped"), handleNameUnwrapped);
  ponder.on(namespaceContract(pluginName, "NameWrapper:FusesSet"), handleFusesSet);
  ponder.on(namespaceContract(pluginName, "NameWrapper:ExpiryExtended"), handleExpiryExtended);
  ponder.on(namespaceContract(pluginName, "NameWrapper:TransferSingle"), handleTransferSingle);
  ponder.on(namespaceContract(pluginName, "NameWrapper:TransferBatch"), handleTransferBatch);
}
