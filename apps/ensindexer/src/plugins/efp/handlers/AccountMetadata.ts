import { accountMetadataId } from "enssdk/efp";
import type { Hex } from "viem";

import { PluginName } from "@ensnode/ensnode-sdk";

import { addOnchainEventListener, ensIndexerSchema } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";

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
      // `key` is a free-form on-chain string used as a primary-key component. Strip NUL bytes: a
      // Postgres text column rejects them (a NUL key would crash the insert), and the tag path
      // strips them too for api-v2 parity.
      const key = event.args.key.replace(/\0/g, "");

      await context.ensDb
        .insert(ensIndexerSchema.efpAccountMetadata)
        .values({
          id: accountMetadataId(context.chain.id, address, key),
          chainId: context.chain.id,
          contractAddress: event.log.address.toLowerCase() as Hex,
          address,
          key,
          value: event.args.value,
          createdAt: ts,
          updatedAt: ts,
        })
        .onConflictDoUpdate({ value: event.args.value, updatedAt: ts });
    },
  );
}
