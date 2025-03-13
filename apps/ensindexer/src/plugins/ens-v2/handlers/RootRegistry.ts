import { ponder } from "ponder:registry";

import { PonderENSPluginHandlerArgs } from "../../../lib/plugin-helpers";
import {
  handleNewSubname,
  handleTransferBatch,
  handleTransferSingle,
  handleURI,
} from "./shared/Registry";

export default function ({ namespace }: PonderENSPluginHandlerArgs<"ens-v2">) {
  ponder.on(namespace("RootRegistry:NewSubname"), handleNewSubname);
  ponder.on(namespace("RootRegistry:TransferSingle"), handleTransferSingle);
  ponder.on(namespace("RootRegistry:TransferBatch"), handleTransferBatch);
  ponder.on(namespace("RootRegistry:URI"), handleURI);
}
