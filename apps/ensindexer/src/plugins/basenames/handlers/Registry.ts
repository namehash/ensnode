import { ponder } from "ponder:registry";

import { PluginName } from "@ensnode/ensnode-sdk";

import {
  handleNewOwner,
  handleNewResolver,
  handleNewTTL,
  handleTransfer,
} from "@/handlers/Registry";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";
import { setupRootNode } from "@/lib/subgraph-helpers";

export default function ({
  pluginNamespace: ns,
}: ENSIndexerPluginHandlerArgs<PluginName.Basenames>) {
  ponder.on(ns("Registry:setup"), setupRootNode);
  ponder.on(ns("Registry:NewOwner"), handleNewOwner(true));
  ponder.on(ns("Registry:NewResolver"), handleNewResolver);
  ponder.on(ns("Registry:NewTTL"), handleNewTTL);
  ponder.on(ns("Registry:Transfer"), handleTransfer);
}
