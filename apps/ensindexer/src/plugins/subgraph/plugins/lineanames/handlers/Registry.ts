import { ponder } from "ponder:registry";

import { PluginName } from "@ensnode/ensnode-sdk";

import { namespaceContract } from "@/lib/plugin-helpers";
import { setupRootNode } from "@/lib/subgraph-helpers";
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
  const pluginName = PluginName.Lineanames;

  ponder.on(namespaceContract(pluginName, "Registry:setup"), setupRootNode);
  ponder.on(namespaceContract(pluginName, "Registry:NewOwner"), handleNewOwner(true));
  ponder.on(namespaceContract(pluginName, "Registry:NewResolver"), handleNewResolver);
  ponder.on(namespaceContract(pluginName, "Registry:NewTTL"), handleNewTTL);
  ponder.on(namespaceContract(pluginName, "Registry:Transfer"), handleTransfer);
}
