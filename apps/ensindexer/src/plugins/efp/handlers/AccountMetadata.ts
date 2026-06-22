import { toNormalizedAddress } from "enssdk";
import { accountMetadataId, decodePrimaryListTokenId, EFP_PRIMARY_LIST_KEY } from "enssdk/efp";

import { PluginName } from "@ensnode/ensnode-sdk";
import { interpretMetadataKey } from "@ensnode/ensnode-sdk/internal";

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
      const { addr, key: rawKey, value } = event.args;

      // A key carrying a NULL byte is rejected (a Postgres `text` column cannot store one) rather than
      // stripped, which would collapse distinct on-chain keys onto one stored key.
      const key = interpretMetadataKey(rawKey);
      if (key === null) return;

      const ts = event.block.timestamp;
      const address = toNormalizedAddress(addr);

      // For the `primary-list` key, decode the `abi.encodePacked(uint256)` value into a numeric token
      // id now (it can't be compared to the numeric `efp_lists.id` in SQL otherwise), so the validated
      // follower/following social graph is a pure SQL join. `null` for every other key.
      const primaryListTokenId =
        key === EFP_PRIMARY_LIST_KEY ? decodePrimaryListTokenId(value) : null;

      await context.ensDb
        .insert(ensIndexerSchema.efpAccountMetadata)
        .values({
          id: accountMetadataId(context.chain.id, address, key),
          chainId: context.chain.id,
          contractAddress: toNormalizedAddress(event.log.address),
          address,
          key,
          value,
          primaryListTokenId,
          createdAt: ts,
          updatedAt: ts,
        })
        .onConflictDoUpdate({ value, primaryListTokenId, updatedAt: ts });
    },
  );
}
