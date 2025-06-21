import { ponder } from "ponder:registry";

import { makeNameWrapperHandlers } from "@/handlers/NameWrapper";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/ensnode-sdk";

export default function ({
  pluginNamespace: ns,
}: ENSIndexerPluginHandlerArgs<PluginName.Subgraph>) {
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

  ponder.on(ns("NameWrapper:NameWrapped"), handleNameWrapped);
  ponder.on(ns("NameWrapper:NameUnwrapped"), handleNameUnwrapped);
  ponder.on(ns("NameWrapper:FusesSet"), handleFusesSet);
  ponder.on(ns("NameWrapper:ExpiryExtended"), handleExpiryExtended);
  ponder.on(ns("NameWrapper:TransferSingle"), handleTransferSingle);
  ponder.on(ns("NameWrapper:TransferBatch"), handleTransferBatch);
}
