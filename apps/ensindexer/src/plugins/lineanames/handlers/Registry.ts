import { ponder } from "ponder:registry";

import { PluginName } from "@ensnode/utils";

import {
  handleNewOwner,
  handleNewResolver,
  handleNewTTL,
  handleTransfer,
} from "@/handlers/Registry";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";
import { setupRootNode } from "@/lib/subgraph-helpers";

export default function ({ namespace }: ENSIndexerPluginHandlerArgs<PluginName.Lineanames>) {
  ponder.on(namespace("Registry:setup"), setupRootNode);
  ponder.on(namespace("Registry:NewOwner"), handleNewOwner(true));
  ponder.on(namespace("Registry:NewResolver"), handleNewResolver);
  ponder.on(namespace("Registry:NewTTL"), handleNewTTL);
  ponder.on(namespace("Registry:Transfer"), handleTransfer);
}
