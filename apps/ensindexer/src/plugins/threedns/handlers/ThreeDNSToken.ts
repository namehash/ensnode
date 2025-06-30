import { ponder } from "ponder:registry";

import { PluginName } from "@ensnode/ensnode-sdk";

import {
  handleNewOwner,
  handleRegistrationCreated,
  handleRegistrationExtended,
  handleTransfer,
} from "@/handlers/ThreeDNSToken";
import { namespaceContract } from "@/lib/plugin-helpers";
import { setupRootNode } from "@/lib/subgraph-helpers";

export function attachThreeDNSTokenEventHandlers() {
  const pluginName = PluginName.ThreeDNS;

  ponder.on(namespaceContract(pluginName, "ThreeDNSToken:setup"), setupRootNode);
  ponder.on(namespaceContract(pluginName, "ThreeDNSToken:NewOwner"), handleNewOwner);
  ponder.on(namespaceContract(pluginName, "ThreeDNSToken:Transfer"), handleTransfer);
  ponder.on(
    namespaceContract(pluginName, "ThreeDNSToken:RegistrationCreated"),
    handleRegistrationCreated,
  );
  ponder.on(
    namespaceContract(pluginName, "ThreeDNSToken:RegistrationExtended"),
    handleRegistrationExtended,
  );
}
