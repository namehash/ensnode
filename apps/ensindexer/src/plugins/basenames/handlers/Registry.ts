import { ponder } from "ponder:registry";

import { makeRegistryHandlers, setupRootNode } from "@/handlers/Registry";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/utils";

export default function ({
  pluginName,
  namespace,
}: ENSIndexerPluginHandlerArgs<PluginName.Basenames>) {
  const {
    handleNewOwner, //
    handleNewResolver,
    handleNewTTL,
    handleTransfer,
  } = makeRegistryHandlers({
    pluginName,
  });

  ponder.on(namespace("Registry:setup"), setupRootNode);
  ponder.on(namespace("Registry:NewOwner"), handleNewOwner(true));
  ponder.on(namespace("Registry:NewResolver"), handleNewResolver);
  ponder.on(namespace("Registry:NewTTL"), handleNewTTL);
  ponder.on(namespace("Registry:Transfer"), handleTransfer);
}
