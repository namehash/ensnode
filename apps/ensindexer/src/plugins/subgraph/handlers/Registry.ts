import { ponder } from "ponder:registry";

import { makeRegistryHandlers } from "@/handlers/Registry";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/utils";

export default function ({
  pluginName,
  namespace,
}: ENSIndexerPluginHandlerArgs<PluginName.Subgraph>) {
  const {
    handleNewOwner, //
  } = makeRegistryHandlers({
    pluginName,
  });

  ponder.on(namespace("RegistryOld:NewOwner"), async ({ context, event }) => {
    await handleNewOwner(false)({ context, event });
  });
}
