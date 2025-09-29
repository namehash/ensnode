import { ponder } from "ponder:registry";

import { namespaceContract } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/ensnode-sdk";

import {
  ensureResolverRecords,
  handleResolverNameUpdate,
} from "../lib/resolver-records-db-helpers";

/**
 * Handlers for pre-ENSIP-19 ReverseResolver contracts in the Protocol Acceleration Plugin.
 * - indexes just the `name` records, in order to power Protocol Acceleration for ENSIP-19 L2 Primary Names.
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
