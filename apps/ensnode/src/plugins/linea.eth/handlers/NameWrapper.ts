import { ponder } from "ponder:registry";
import { makeNameWrapperHandlers } from "../../../handlers/NameWrapper";
import { PonderENSPluginHandlerOptions } from "../../../lib/plugin-helpers";

export default function ({ ownedName, namespace }: PonderENSPluginHandlerOptions<"linea.eth">) {
  const {
    handleNameWrapped,
    handleNameUnwrapped,
    handleFusesSet,
    handleExpiryExtended,
    handleTransferSingle,
    handleTransferBatch,
  } = makeNameWrapperHandlers(ownedName);

  ponder.on(namespace("NameWrapper:NameWrapped"), handleNameWrapped);
  ponder.on(namespace("NameWrapper:NameUnwrapped"), handleNameUnwrapped);
  ponder.on(namespace("NameWrapper:FusesSet"), handleFusesSet);
  ponder.on(namespace("NameWrapper:ExpiryExtended"), handleExpiryExtended);
  ponder.on(namespace("NameWrapper:TransferSingle"), handleTransferSingle);
  ponder.on(namespace("NameWrapper:TransferBatch"), handleTransferBatch);
}
