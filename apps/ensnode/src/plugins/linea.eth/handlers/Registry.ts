import { ponder } from "ponder:registry";
import {
  handleNewOwner,
  handleNewResolver,
  handleNewTTL,
  handleTransfer,
  setupRootNode,
} from "../../../handlers/Registry";
import { pluginNamespace } from "../ponder.config";

export default function () {
  ponder.on(pluginNamespace("Registry:setup"), setupRootNode);
  ponder.on(pluginNamespace("Registry:NewOwner"), handleNewOwner(true));
  ponder.on(pluginNamespace("Registry:NewResolver"), handleNewResolver);
  ponder.on(pluginNamespace("Registry:NewTTL"), handleNewTTL);
  ponder.on(pluginNamespace("Registry:Transfer"), handleTransfer);
}
