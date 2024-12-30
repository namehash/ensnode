import { ponder } from "ponder:registry";
import {
  handleExpiryExtended,
  handleFusesSet,
  handleNameUnwrapped,
  handleNameWrapped,
  handleTransferBatch,
  handleTransferSingle,
} from "../../../handlers/NameWrapper";
import { loadCheckpoint } from "../../../lib/checkpoints";
import { pluginNamespace } from "../ponder.config";

export default function () {
  ponder.on(pluginNamespace("NameWrapper:setup"), async ({ context }) => {
    await loadCheckpoint(context);
  });

  ponder.on(pluginNamespace("NameWrapper:NameWrapped"), handleNameWrapped);
  ponder.on(pluginNamespace("NameWrapper:NameUnwrapped"), handleNameUnwrapped);
  ponder.on(pluginNamespace("NameWrapper:FusesSet"), handleFusesSet);
  ponder.on(pluginNamespace("NameWrapper:ExpiryExtended"), handleExpiryExtended);
  ponder.on(pluginNamespace("NameWrapper:TransferSingle"), handleTransferSingle);
  ponder.on(pluginNamespace("NameWrapper:TransferBatch"), handleTransferBatch);
}
