import { ponder } from "ponder:registry";

import { makeNameWrapperHandlers } from "@/handlers/NameWrapper";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/utils";

export default function ({ namespace }: ENSIndexerPluginHandlerArgs<PluginName.Lineanames>) {
  const {
    handleNameWrapped,
    handleNameUnwrapped,
    handleFusesSet,
    handleExpiryExtended,
    handleTransferSingle,
    handleTransferBatch,
  } = makeNameWrapperHandlers({
    // the shared Registrar handlers in this plugin index direct subnames of '.linea.eth'
    registrarManagedName: "linea.eth",
  });

  ponder.on(namespace("NameWrapper:NameWrapped"), handleNameWrapped);
  ponder.on(namespace("NameWrapper:NameUnwrapped"), handleNameUnwrapped);
  ponder.on(namespace("NameWrapper:FusesSet"), handleFusesSet);
  ponder.on(namespace("NameWrapper:ExpiryExtended"), handleExpiryExtended);
  ponder.on(namespace("NameWrapper:TransferSingle"), handleTransferSingle);
  ponder.on(namespace("NameWrapper:TransferBatch"), handleTransferBatch);
}
