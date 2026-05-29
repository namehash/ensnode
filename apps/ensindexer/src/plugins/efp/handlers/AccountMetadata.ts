import type { Hex } from "viem";

import { PluginName } from "@ensnode/ensnode-sdk";

import { addOnchainEventListener, ensIndexerSchema } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";

import { accountMetadataId } from "../lib/ids";

const pluginName = PluginName.EFP;

/**
 * Registers the EFP `AccountMetadata` event handler (UpdateAccountMetadata).
 */
export default function () {
  // UpdateAccountMetadata — writes a single (key, value) pair for an account (today: `primary-list`).
  addOnchainEventListener(
    namespaceContract(pluginName, "AccountMetadata:UpdateAccountMetadata"),
    async ({ context, event }) => {
      const ts = event.block.timestamp;
      const address = event.args.addr.toLowerCase() as Hex;

      await context.ensDb
        .insert(ensIndexerSchema.efpAccountMetadata)
        .values({
          id: accountMetadataId(address, event.args.key),
          chainId: context.chain.id,
          contractAddress: event.log.address.toLowerCase() as Hex,
          address,
          key: event.args.key,
          value: event.args.value,
          createdAt: ts,
          updatedAt: ts,
        })
        .onConflictDoUpdate({ value: event.args.value, updatedAt: ts });
    },
  );
}
