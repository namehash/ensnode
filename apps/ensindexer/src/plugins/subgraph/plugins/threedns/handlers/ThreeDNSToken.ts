import { PluginName } from "@ensnode/ensnode-sdk";

import { addOnchainEventListener } from "@/lib/indexing-engines/ponder";
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

  addOnchainEventListener(namespaceContract(pluginName, "ThreeDNSToken:setup"), setupRootNode);
  addOnchainEventListener(namespaceContract(pluginName, "ThreeDNSToken:NewOwner"), handleNewOwner);
  addOnchainEventListener(namespaceContract(pluginName, "ThreeDNSToken:Transfer"), handleTransfer);
  addOnchainEventListener(
    namespaceContract(pluginName, "ThreeDNSToken:RegistrationCreated"),
    handleRegistrationCreated,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "ThreeDNSToken:RegistrationExtended"),
    handleRegistrationExtended,
  );
}
