import { ponder } from "ponder:registry";

import { namespaceContract } from "@/lib/plugin-helpers";
import {
  ensureResolverRecords,
  handleResolverNameUpdate,
} from "@/plugins/protocol-acceleration/lib/protocol-acceleration-db-helpers";
import { PluginName } from "@ensnode/ensnode-sdk";

/**
 * Handlers for pre-ENSIP-19 ReverseResolver contracts. Their purpose is to index
 * just the `name` records, in order to power Protocol Acceleration for ENSIP-19 L2 Primary Names.
 */
export default function () {
  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "LegacyReverseResolver:NameChanged"),
    async ({ context, event }) => {
      const { name } = event.args;

      const id = await ensureResolverRecords(context, event);
      await handleResolverNameUpdate(context, id, name);
    },
  );
}
