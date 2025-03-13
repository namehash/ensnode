import { ponder } from "ponder:registry";

import { PonderENSPluginHandlerArgs } from "../../../lib/plugin-helpers";
import {
  handleNewSubname,
  handleTransferBatch,
  handleTransferSingle,
  handleURI,
} from "./shared/Registry";

export default function ({ namespace }: PonderENSPluginHandlerArgs<"ens-v2">) {
  ponder.on(namespace("EthRegistry:NewSubname"), handleNewSubname);
  ponder.on(namespace("EthRegistry:TransferSingle"), handleTransferSingle);
  ponder.on(namespace("EthRegistry:TransferBatch"), handleTransferBatch);
  ponder.on(namespace("EthRegistry:URI"), handleURI);
}
