import { ponder } from "ponder:registry";

import config from "@/config";
import { makeNameWrapperHandlers } from "@/handlers/NameWrapper";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/ensnode-sdk";
import { getRegistrarManagedName } from "../lib/registrar-helpers";

export default function ({
  pluginNamespace: ns,
}: ENSIndexerPluginHandlerArgs<PluginName.Lineanames>) {
  const {
    handleNameWrapped,
    handleNameUnwrapped,
    handleFusesSet,
    handleExpiryExtended,
    handleTransferSingle,
    handleTransferBatch,
  } = makeNameWrapperHandlers({
    // the shared Registrar handlers in this plugin index direct subnames of
    // the name returned from `getRegistrarManagedName` function call
    registrarManagedName: getRegistrarManagedName(config.namespace),
  });

  ponder.on(ns("NameWrapper:NameWrapped"), handleNameWrapped);
  ponder.on(ns("NameWrapper:NameUnwrapped"), handleNameUnwrapped);
  ponder.on(ns("NameWrapper:FusesSet"), handleFusesSet);
  ponder.on(ns("NameWrapper:ExpiryExtended"), handleExpiryExtended);
  ponder.on(ns("NameWrapper:TransferSingle"), handleTransferSingle);
  ponder.on(ns("NameWrapper:TransferBatch"), handleTransferBatch);
}
