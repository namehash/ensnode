import { ponder } from "ponder:registry";

import { PluginName } from "@ensnode/ensnode-sdk";

import config from "@/config";
import {
  handleNewOwner,
  handleNewResolver,
  handleNewTTL,
  handleTransfer,
} from "@/handlers/Registry";
import { namespaceContract } from "@/lib/plugin-helpers";
import { setupRootNode } from "@/lib/subgraph-helpers";

const pluginName = PluginName.Lineanames;

if (config.plugins.includes(pluginName)) {
  ponder.on(namespaceContract(pluginName, "Registry:setup"), setupRootNode);
  ponder.on(namespaceContract(pluginName, "Registry:NewOwner"), handleNewOwner(true));
  ponder.on(namespaceContract(pluginName, "Registry:NewResolver"), handleNewResolver);
  ponder.on(namespaceContract(pluginName, "Registry:NewTTL"), handleNewTTL);
  ponder.on(namespaceContract(pluginName, "Registry:Transfer"), handleTransfer);
}
