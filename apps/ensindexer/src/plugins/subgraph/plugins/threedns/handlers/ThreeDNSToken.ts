import { ponder } from "ponder:registry";

import { PluginName } from "@ensnode/ensnode-sdk";

import { namespaceContract } from "@/lib/plugin-helpers";
import { setupRootNode } from "@/lib/subgraph/subgraph-helpers";
import {
  handleNewOwner,
  handleRegistrationCreated,
  handleRegistrationExtended,
  handleTransfer,
} from "@/plugins/subgraph/shared-handlers/ThreeDNSToken";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
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
