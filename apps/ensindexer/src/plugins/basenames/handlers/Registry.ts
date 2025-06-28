import { ponder } from "ponder:registry";

import { PluginName } from "@ensnode/ensnode-sdk";

import {
  handleNewOwner,
  handleNewResolver,
  handleNewTTL,
  handleTransfer,
} from "@/handlers/Registry";
import { makePluginNamespace } from "@/lib/plugin-helpers";
import { setupRootNode } from "@/lib/subgraph-helpers";

/**
 * Attach a set of event handlers for indexing process.
 */
export function attachBasenamesRegistryEventHandlers() {
  const pluginName = PluginName.Basenames;
  // create a namespace for the plugin events to avoid conflicts with other plugins
  const ns = makePluginNamespace(pluginName);

  ponder.on(ns("Registry:setup"), setupRootNode);
  ponder.on(ns("Registry:NewOwner"), handleNewOwner(true));
  ponder.on(ns("Registry:NewResolver"), handleNewResolver);
  ponder.on(ns("Registry:NewTTL"), handleNewTTL);
  ponder.on(ns("Registry:Transfer"), handleTransfer);
}
