import { ponder } from "ponder:registry";

import { makeNameWrapperHandlers } from "@/handlers/NameWrapper";
import { PonderENSPluginHandlerArgs } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/utils";

export default function ({
  registrarManagedName,
  namespace,
}: PonderENSPluginHandlerArgs<PluginName.Root>) {
  const {
    handleExpiryExtended,
    handleFusesSet,
    handleNameUnwrapped,
    handleNameWrapped,
    handleTransferBatch,
    handleTransferSingle,
  } = makeNameWrapperHandlers({
    eventIdPrefix: null, // NOTE: no event id prefix for root plugin (subgraph-compat)
    registrarManagedName,
  });

  ponder.on(namespace("NameWrapper:NameWrapped"), handleNameWrapped);
  ponder.on(namespace("NameWrapper:NameUnwrapped"), handleNameUnwrapped);
  ponder.on(namespace("NameWrapper:FusesSet"), handleFusesSet);
  ponder.on(namespace("NameWrapper:ExpiryExtended"), handleExpiryExtended);
  ponder.on(namespace("NameWrapper:TransferSingle"), handleTransferSingle);
  ponder.on(namespace("NameWrapper:TransferBatch"), handleTransferBatch);
}
