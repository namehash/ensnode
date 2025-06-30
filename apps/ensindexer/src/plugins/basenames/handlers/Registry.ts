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
 * Registers event handlers with Ponder.
 */
export function attachBasenamesRegistryEventHandlers() {
  const pluginName = PluginName.Basenames;

  ponder.on(namespaceContract(pluginName, "Registry:setup"), setupRootNode);
  ponder.on(namespaceContract(pluginName, "Registry:NewOwner"), handleNewOwner(true));
  ponder.on(namespaceContract(pluginName, "Registry:NewResolver"), handleNewResolver);
  ponder.on(namespaceContract(pluginName, "Registry:NewTTL"), handleNewTTL);
  ponder.on(namespaceContract(pluginName, "Registry:Transfer"), handleTransfer);
}
