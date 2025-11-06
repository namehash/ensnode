import { ponder } from "ponder:registry";

import { PluginName } from "@ensnode/ensnode-sdk";

import { namespaceContract } from "@/lib/plugin-helpers";

ponder.on(namespaceContract(PluginName.ENSv2, "RegistryOld:setup"), async ({ context }) => {
  console.log("hello world");
});
