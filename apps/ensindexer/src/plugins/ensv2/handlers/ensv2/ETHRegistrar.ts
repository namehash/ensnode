import { ponder } from "ponder:registry";

import { PluginName } from "@ensnode/ensnode-sdk";

import { namespaceContract } from "@/lib/plugin-helpers";

const pluginName = PluginName.ENSv2;

export default function () {
  ponder.on(
    namespaceContract(pluginName, "ETHRegistrar:NameRegistered"),
    async ({ context, event }) => {
      // TODO add to existing Registration, override registrant (BaseRegistrar uses msg.sender)
    },
  );

  ponder.on(
    namespaceContract(pluginName, "ETHRegistrar:NameRenewed"),
    async ({ context, event }) => {
      // TODO add to existing Renewal ditto above
    },
  );
}
