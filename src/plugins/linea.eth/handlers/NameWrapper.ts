import { ponder } from "ponder:registry";
import { makeRegistryHandlers } from "../../../handlers/NameWrapper";
import { ownedName, pluginNamespace } from "../ponder.config";

const {
  handleNameWrapped,
  handleNameUnwrapped,
  handleFusesSet,
  handleExpiryExtended,
  handleTransferSingle,
  handleTransferBatch,
} = makeRegistryHandlers(ownedName);

export default function () {
  ponder.on(pluginNamespace("NameWrapper:NameWrapped"), handleNameWrapped);
  ponder.on(pluginNamespace("NameWrapper:NameUnwrapped"), handleNameUnwrapped);
  ponder.on(pluginNamespace("NameWrapper:FusesSet"), handleFusesSet);
  ponder.on(pluginNamespace("NameWrapper:ExpiryExtended"), handleExpiryExtended);
  ponder.on(pluginNamespace("NameWrapper:TransferSingle"), handleTransferSingle);
  ponder.on(pluginNamespace("NameWrapper:TransferBatch"), handleTransferBatch);
}
