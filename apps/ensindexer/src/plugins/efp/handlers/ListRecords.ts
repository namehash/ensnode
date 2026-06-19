import { toNormalizedAddress } from "enssdk";
import { listMetadataId, listRecordId, storageLocationId } from "enssdk/efp";

import { PluginName } from "@ensnode/ensnode-sdk";

import { EFP_LIST_METADATA_KEYS, EFP_OPCODE } from "@/lib/efp/constants";
import { interpretMetadataValue } from "@/lib/efp/list-metadata";
import { parseListOp, parseRecord, parseTagOp, slotToBytes32 } from "@/lib/efp/parse-list-op";
import { addOnchainEventListener, ensIndexerSchema } from "@/lib/indexing-engines/ponder";
import { logger } from "@/lib/logger";
import { namespaceContract } from "@/lib/plugin-helpers";

const pluginName = PluginName.EFP;

/**
 * Registers the EFP `ListRecords` event handlers (ListOp, UpdateListMetadata).
 */
export default function () {
  // ListOp — opcode-dispatched add/remove of records and tags.
  addOnchainEventListener(
    namespaceContract(pluginName, "ListRecords:ListOp"),
    async ({ context, event }) => {
      const parsed = parseListOp(event.args.op);
      if (!parsed) return;

      const ts = event.block.timestamp;
      const chainId = context.chain.id;
      const contractAddress = toNormalizedAddress(event.log.address);
      const slot = slotToBytes32(event.args.slot);

      switch (parsed.opcode) {
        case EFP_OPCODE.ADD_RECORD: {
          const record = parseRecord(parsed.data);
          if (!record) return;
          await context.ensDb
            .insert(ensIndexerSchema.efpListRecords)
            .values({
              id: listRecordId(chainId, contractAddress, slot, record.record),
              chainId,
              contractAddress,
              slot,
              record: record.record,
              recordVersion: record.version,
              recordType: record.recordType,
              recordData: record.recordData,
              tags: [],
              createdAt: ts,
            })
            .onConflictDoNothing();
          return;
        }

        case EFP_OPCODE.REMOVE_RECORD: {
          const record = parseRecord(parsed.data);
          if (!record) return;
          // The record's embedded `tags` are removed with the row, so this is a single PK delete.
          await context.ensDb.delete(ensIndexerSchema.efpListRecords, {
            id: listRecordId(chainId, contractAddress, slot, record.record),
          });
          return;
        }

        case EFP_OPCODE.ADD_TAG: {
          const tagOp = parseTagOp(parsed.data);
          if (!tagOp) return;
          const id = listRecordId(chainId, contractAddress, slot, tagOp.record);
          const record = await context.ensDb.find(ensIndexerSchema.efpListRecords, { id });
          // Ops for a (chain, contract, slot) are indexed in on-chain order, so a tag with no record
          // means the record is not in the list: removed earlier, or (anomalously) never added.
          // Either way there is no row to tag; this is an expected on-chain condition (EFP's own
          // indexer logs and skips such ops), so log at debug rather than flood warnings.
          if (!record) {
            logger.debug({ msg: `EFP ADD_TAG references absent record ${id} (tag "${tagOp.tag}")` });
            return;
          }
          // A record's tags are a set, so skip a tag it already carries.
          if (record.tags.includes(tagOp.tag)) return;
          await context.ensDb
            .update(ensIndexerSchema.efpListRecords, { id })
            .set({ tags: [...record.tags, tagOp.tag] });
          return;
        }

        case EFP_OPCODE.REMOVE_TAG: {
          const tagOp = parseTagOp(parsed.data);
          if (!tagOp) return;
          const id = listRecordId(chainId, contractAddress, slot, tagOp.record);
          const record = await context.ensDb.find(ensIndexerSchema.efpListRecords, { id });
          // As with ADD_TAG, an absent record is an expected on-chain condition (the record was
          // removed earlier or never added); log at debug rather than flood warnings.
          if (!record) {
            logger.debug({
              msg: `EFP REMOVE_TAG references absent record ${id} (tag "${tagOp.tag}")`,
            });
            return;
          }
          if (!record.tags.includes(tagOp.tag)) return;
          await context.ensDb
            .update(ensIndexerSchema.efpListRecords, { id })
            .set({ tags: record.tags.filter((existing) => existing !== tagOp.tag) });
          return;
        }

        default:
          // Unknown opcode — skip (resilient to future op versions).
          return;
      }
    },
  );

  // UpdateListMetadata — updates a list's user/manager, keyed by storage location (slot).
  addOnchainEventListener(
    namespaceContract(pluginName, "ListRecords:UpdateListMetadata"),
    async ({ context, event }) => {
      const key = event.args.key;
      // Only `user` / `manager` are reflected onto efp_lists today; ignore any other key.
      if (key !== EFP_LIST_METADATA_KEYS.USER && key !== EFP_LIST_METADATA_KEYS.MANAGER) return;

      const ts = event.block.timestamp;
      const chainId = context.chain.id;
      const contractAddress = toNormalizedAddress(event.log.address);
      const slot = slotToBytes32(event.args.slot);

      // Record the location's latest metadata durably (keyed by location + key) so it can be
      // (re-)applied to whichever list points at this slot, now or after a future re-point, and so
      // it survives whichever of UpdateListMetadata / UpdateListStorageLocation arrives first.
      const id = listMetadataId(chainId, contractAddress, slot, key);
      await context.ensDb
        .insert(ensIndexerSchema.efpListMetadata)
        .values({ id, chainId, contractAddress, slot, key, value: event.args.value, createdAt: ts })
        .onConflictDoUpdate({ value: event.args.value });

      // If a list currently points at this storage location, apply the role to it now.
      // `interpretMetadataValue` returns null for a non-20-byte value, intentionally clearing the
      // role: a malformed `user`/`manager` value is no longer a valid address, so reflecting "no
      // role" is faithful to on-chain state.
      const mapping = await context.ensDb.find(ensIndexerSchema.efpListStorageLocations, {
        id: storageLocationId(chainId, contractAddress, slot),
      });
      if (!mapping) return;

      const address = interpretMetadataValue(event.args.value);
      await context.ensDb
        .update(ensIndexerSchema.efpLists, { id: mapping.tokenId })
        .set(
          key === EFP_LIST_METADATA_KEYS.USER
            ? { user: address, updatedAt: ts }
            : { manager: address, updatedAt: ts },
        );
    },
  );
}
