import { ponder } from "ponder:registry";

import config from "@/config";
import { makeNameWrapperHandlers } from "@/handlers/NameWrapper";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/ensnode-sdk";
import { getRegistrarManagedName } from "../lib/registrar-helpers";

export default function ({
  pluginName,
  namespace,
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
    registrarManagedName: getRegistrarManagedName(config.ensDeploymentChain, pluginName),
  });

  ponder.on(namespace("NameWrapper:NameWrapped"), handleNameWrapped);
  ponder.on(namespace("NameWrapper:NameUnwrapped"), handleNameUnwrapped);
  ponder.on(namespace("NameWrapper:FusesSet"), handleFusesSet);
  ponder.on(namespace("NameWrapper:ExpiryExtended"), handleExpiryExtended);
  ponder.on(namespace("NameWrapper:TransferSingle"), handleTransferSingle);
  ponder.on(namespace("NameWrapper:TransferBatch"), handleTransferBatch);
}
