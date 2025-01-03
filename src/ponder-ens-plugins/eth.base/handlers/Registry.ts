import { ponder } from "ponder:registry";
import {
  handleNewOwner,
  handleNewResolver,
  handleNewTTL,
  handleTransfer,
  setup,
} from "../../../handlers/Registry";
import { PonderEnsIndexingHandlerModule } from "../../types";
import { ns } from "../ponder.config";

function initRegistryHandlers() {
  ponder.on(ns("Registry:setup"), setup);
  ponder.on(ns("Registry:NewOwner"), handleNewOwner(true));
  ponder.on(ns("Registry:NewResolver"), handleNewResolver);
  ponder.on(ns("Registry:NewTTL"), handleNewTTL);
  ponder.on(ns("Registry:Transfer"), handleTransfer);
}

export const handlerModule: Readonly<PonderEnsIndexingHandlerModule> = {
  attachHandlers: initRegistryHandlers,
};
