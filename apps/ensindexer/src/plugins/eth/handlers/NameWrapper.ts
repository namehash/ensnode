import { ponder } from "ponder:registry";

import { makeNameWrapperHandlers } from "@/handlers/NameWrapper";
import { PonderENSPluginHandlerArgs } from "@/lib/plugin-helpers";

export default function ({ registrarManagedName, namespace }: PonderENSPluginHandlerArgs<"eth">) {
  const {
    handleExpiryExtended,
    handleFusesSet,
    handleNameUnwrapped,
    handleNameWrapped,
    handleTransferBatch,
    handleTransferSingle,
  } = makeNameWrapperHandlers({
    eventIdPrefix: undefined, // NOTE: no event id prefix for root plugin
    registrarManagedName,
  });

  ponder.on(namespace("NameWrapper:NameWrapped"), handleNameWrapped);
  ponder.on(namespace("NameWrapper:NameUnwrapped"), handleNameUnwrapped);
  ponder.on(namespace("NameWrapper:FusesSet"), handleFusesSet);
  ponder.on(namespace("NameWrapper:ExpiryExtended"), handleExpiryExtended);
  ponder.on(namespace("NameWrapper:TransferSingle"), handleTransferSingle);
  ponder.on(namespace("NameWrapper:TransferBatch"), handleTransferBatch);
}
