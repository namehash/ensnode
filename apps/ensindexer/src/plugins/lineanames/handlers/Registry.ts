import { ponder } from "ponder:registry";

import { makeRegistryHandlers, setupRootNode } from "@/handlers/Registry";
import { PonderENSPluginHandlerArgs } from "@/lib/plugin-helpers";

export default function ({ pluginName, namespace }: PonderENSPluginHandlerArgs<"lineanames">) {
  const {
    handleNewOwner, //
    handleNewResolver,
    handleNewTTL,
    handleTransfer,
  } = makeRegistryHandlers({
    eventIdPrefix: pluginName,
  });

  ponder.on(namespace("Registry:setup"), setupRootNode);
  ponder.on(namespace("Registry:NewOwner"), handleNewOwner(true));
  ponder.on(namespace("Registry:NewResolver"), handleNewResolver);
  ponder.on(namespace("Registry:NewTTL"), handleNewTTL);
  ponder.on(namespace("Registry:Transfer"), handleTransfer);
}
