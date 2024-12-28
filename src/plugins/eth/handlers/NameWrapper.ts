import { ponder } from "ponder:registry";
import {
  handleExpiryExtended,
  handleFusesSet,
  handleNameUnwrapped,
  handleNameWrapped,
  handleTransferBatch,
  handleTransferSingle,
} from "../../../handlers/NameWrapper";
import { pluginNamespace } from "../ponder.config";

export default function () {
  ponder.on(pluginNamespace("NameWrapper:NameWrapped"), handleNameWrapped);
  ponder.on(pluginNamespace("NameWrapper:NameUnwrapped"), handleNameUnwrapped);
  ponder.on(pluginNamespace("NameWrapper:FusesSet"), handleFusesSet);
  ponder.on(pluginNamespace("NameWrapper:ExpiryExtended"), handleExpiryExtended);
  ponder.on(pluginNamespace("NameWrapper:TransferSingle"), handleTransferSingle);
  ponder.on(pluginNamespace("NameWrapper:TransferBatch"), handleTransferBatch);
}
