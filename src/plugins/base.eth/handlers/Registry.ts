import { ponder } from "ponder:registry";
import {
  handleNewOwner,
  handleNewResolver,
  handleNewTTL,
  handleTransfer,
  setupRootNode,
} from "../../../handlers/Registry";
import { ponderNamespace } from "../ponder.config";

export default function () {
  ponder.on(ponderNamespace("Registry:setup"), setupRootNode);
  ponder.on(ponderNamespace("Registry:NewOwner"), handleNewOwner(true));
  ponder.on(ponderNamespace("Registry:NewResolver"), handleNewResolver);
  ponder.on(ponderNamespace("Registry:NewTTL"), handleNewTTL);
  ponder.on(ponderNamespace("Registry:Transfer"), handleTransfer);
}
