import { ponder } from "ponder:registry";
import { makeRegistryHandlers, setupRootNode } from "../../../handlers/Registry";
import { PonderENSPluginHandlerArgs } from "../../../lib/plugin-helpers";

export default function ({ ownedName, namespace }: PonderENSPluginHandlerArgs<"">) {
  const {
    handleNewOwner, //
    handleNewResolver,
    handleNewTTL,
    handleTransfer,
  } = makeRegistryHandlers(ownedName);

  ponder.on(namespace("ThreeDNSRegControl:setup"), setupRootNode);
  ponder.on(namespace("ThreeDNSRegControl:NewOwner"), handleNewOwner(true));
  ponder.on(namespace("ThreeDNSRegControl:NewResolver"), handleNewResolver);
  ponder.on(namespace("ThreeDNSRegControl:NewTTL"), handleNewTTL);
  ponder.on(namespace("ThreeDNSRegControl:Transfer"), handleTransfer);
}
