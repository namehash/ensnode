import { ponder } from "ponder:registry";

import { makeRegistryHandlers, setupRootNode } from "@/handlers/Registry";
import { PonderENSPluginHandlerArgs } from "@/lib/plugin-helpers";

export default function ({
  canHealReverseAddressFromParentNode,
  ownedName,
  namespace,
}: PonderENSPluginHandlerArgs<"base.eth">) {
  const {
    handleNewOwner, //
    handleNewResolver,
    handleNewTTL,
    handleTransfer,
  } = makeRegistryHandlers({
    canHealReverseAddressFromParentNode,
    ownedName,
  });

  ponder.on(namespace("Registry:setup"), setupRootNode);
  ponder.on(namespace("Registry:NewOwner"), handleNewOwner(true));
  ponder.on(namespace("Registry:NewResolver"), handleNewResolver);
  ponder.on(namespace("Registry:NewTTL"), handleNewTTL);
  ponder.on(namespace("Registry:Transfer"), handleTransfer);
}
