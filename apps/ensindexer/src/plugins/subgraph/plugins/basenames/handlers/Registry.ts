import { PluginName } from "@ensnode/ensnode-sdk";

import { addOnchainEventListener } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";
import { setupRootNode } from "@/lib/subgraph/subgraph-helpers";
import {
  handleNewOwner,
  handleNewResolver,
  handleNewTTL,
  handleTransfer,
} from "@/plugins/subgraph/shared-handlers/Registry";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Basenames;

  addOnchainEventListener(namespaceContract(pluginName, "Registry:setup"), setupRootNode);
  addOnchainEventListener(namespaceContract(pluginName, "Registry:NewOwner"), handleNewOwner(true));
  addOnchainEventListener(namespaceContract(pluginName, "Registry:NewResolver"), handleNewResolver);
  addOnchainEventListener(namespaceContract(pluginName, "Registry:NewTTL"), handleNewTTL);
  addOnchainEventListener(namespaceContract(pluginName, "Registry:Transfer"), handleTransfer);
}
