import { ponder } from "ponder:registry";
import { makeRegistryHandlers, setupRootNode } from "../../../handlers/Registry";
import { ownedName, pluginNamespace } from "../ponder.config";

const { handleNewOwner, handleNewResolver, handleNewTTL, handleTransfer } =
  makeRegistryHandlers(ownedName);

export default function () {
  ponder.on(pluginNamespace("Registry:setup"), setupRootNode);
  ponder.on(pluginNamespace("Registry:NewOwner"), handleNewOwner(true));
  ponder.on(pluginNamespace("Registry:NewResolver"), handleNewResolver);
  ponder.on(pluginNamespace("Registry:NewTTL"), handleNewTTL);
  ponder.on(pluginNamespace("Registry:Transfer"), handleTransfer);
}
