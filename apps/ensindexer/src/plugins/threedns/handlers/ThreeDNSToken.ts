import { ponder } from "ponder:registry";
import { setupRootNode } from "@/handlers/Registry";
import { makeThreeDNSTokenHandlers } from "@/handlers/ThreeDNSToken";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/utils";

export default function ({
  pluginName,
  namespace,
}: ENSIndexerPluginHandlerArgs<PluginName.ThreeDNS>) {
  // construct identical handlers for both the Optimism and Base ThreeDNSToken contracts
  const { handleNewOwner, handleRegistrationCreated } = makeThreeDNSTokenHandlers({ pluginName });

  // register each handler on each contract
  // ponder.on(namespace("ThreeDNSTokenOptimism:setup"), setupRootNode);
  ponder.on(namespace("ThreeDNSTokenBase:setup"), setupRootNode);

  // ponder.on(namespace("ThreeDNSTokenOptimism:NewOwner"), handleNewOwner);
  ponder.on(namespace("ThreeDNSTokenBase:NewOwner"), handleNewOwner);

  // ponder.on(namespace("ThreeDNSTokenOptimism:RegistrationCreated"), handleRegistrationCreated);
  ponder.on(namespace("ThreeDNSTokenBase:RegistrationCreated"), handleRegistrationCreated);
}
