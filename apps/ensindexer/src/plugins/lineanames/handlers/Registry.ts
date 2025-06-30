import { ponder } from "ponder:registry";

import { PluginName } from "@ensnode/ensnode-sdk";

import {
  handleNewOwner,
  handleNewResolver,
  handleNewTTL,
  handleTransfer,
} from "@/handlers/Registry";
import { namespaceContract } from "@/lib/plugin-helpers";
import { setupRootNode } from "@/lib/subgraph-helpers";

/**
 * Attach a set of event handlers for indexing process.
 */
export function attachLineanamesRegistryEventHandlers() {
  const pluginName = PluginName.Lineanames;

  ponder.on(namespaceContract(pluginName, "Registry:setup"), setupRootNode);
  ponder.on(namespaceContract(pluginName, "Registry:NewOwner"), handleNewOwner(true));
  ponder.on(namespaceContract(pluginName, "Registry:NewResolver"), handleNewResolver);
  ponder.on(namespaceContract(pluginName, "Registry:NewTTL"), handleNewTTL);
  ponder.on(namespaceContract(pluginName, "Registry:Transfer"), handleTransfer);
}
