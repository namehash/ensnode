import { PluginName } from "@ensnode/ensnode-sdk";

import { addOnchainEventListener } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";
import { makeNameWrapperHandlers } from "@/plugins/subgraph/shared-handlers/NameWrapper";

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
  } = makeNameWrapperHandlers();

  addOnchainEventListener(
    namespaceContract(pluginName, "NameWrapper:NameWrapped"),
    handleNameWrapped,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "NameWrapper:NameUnwrapped"),
    handleNameUnwrapped,
  );
  addOnchainEventListener(namespaceContract(pluginName, "NameWrapper:FusesSet"), handleFusesSet);
  addOnchainEventListener(
    namespaceContract(pluginName, "NameWrapper:ExpiryExtended"),
    handleExpiryExtended,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "NameWrapper:TransferSingle"),
    handleTransferSingle,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "NameWrapper:TransferBatch"),
    handleTransferBatch,
  );
}
