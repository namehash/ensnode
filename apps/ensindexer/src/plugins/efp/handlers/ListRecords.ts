import type { Hex } from "viem";

import { PluginName } from "@ensnode/ensnode-sdk";

import { addOnchainEventListener, ensIndexerSchema } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";

import { EFP_LIST_METADATA_KEYS, EFP_OPCODE } from "../constants";
import { listRecordId, pendingListMetadataId, storageLocationId } from "../lib/ids";
import { metadataValueToAddress } from "../lib/list-metadata";
import { parseListOp, parseRecord, parseTagOp, slotToBytes32 } from "../lib/parse-list-op";

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
      const contractAddress = event.log.address.toLowerCase() as Hex;
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
          // Tags attach to a record that is in the list; ops can arrive in any order, so ignore a
          // tag for an absent record. A record's tags are a set — skip duplicates.
          if (!record || record.tags.includes(tagOp.tag)) return;
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
          if (!record || !record.tags.includes(tagOp.tag)) return;
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
      const contractAddress = event.log.address.toLowerCase() as Hex;
      const slot = slotToBytes32(event.args.slot);
      const address = metadataValueToAddress(event.args.value);

      const mapping = await context.ensDb.find(ensIndexerSchema.efpListStorageLocations, {
        id: storageLocationId(chainId, contractAddress, slot),
      });

      if (mapping) {
        await context.ensDb
          .update(ensIndexerSchema.efpLists, { tokenId: mapping.tokenId })
          .set(
            key === EFP_LIST_METADATA_KEYS.USER
              ? { user: address, updatedAt: ts }
              : { manager: address, updatedAt: ts },
          );
        return;
      }

      // No list points at this storage location yet — stage it for the storage-location handler.
      const id = pendingListMetadataId(chainId, contractAddress, slot, key);
      await context.ensDb
        .insert(ensIndexerSchema.efpPendingListMetadata)
        .values({ id, chainId, contractAddress, slot, key, value: event.args.value, createdAt: ts })
        .onConflictDoUpdate({ value: event.args.value, createdAt: ts });
    },
  );
}
