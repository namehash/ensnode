import { and, eq } from "drizzle-orm";
import type { Hex } from "viem";

import { PluginName } from "@ensnode/ensnode-sdk";

import { addOnchainEventListener, ensIndexerSchema } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";

import { EFP_LIST_METADATA_KEYS, EFP_OPCODE } from "../constants";
import {
  listRecordId,
  listRecordTagId,
  pendingListMetadataId,
  storageLocationId,
} from "../lib/ids";
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
              id: listRecordId(chainId, contractAddress, slot, parsed.data),
              chainId,
              contractAddress,
              slot,
              record: parsed.data,
              recordVersion: record.version,
              recordType: record.recordType,
              recordData: record.recordData,
              createdAt: ts,
            })
            .onConflictDoNothing();
          return;
        }

        case EFP_OPCODE.REMOVE_RECORD: {
          await context.ensDb.delete(ensIndexerSchema.efpListRecords, {
            id: listRecordId(chainId, contractAddress, slot, parsed.data),
          });
          // Cascade-delete this record's tags. A record has many (record, tag) rows, so this is not
          // expressible via the PK-only Store API — use the raw drizzle escape hatch. This flushes
          // ponder's cache to Postgres, accepted because record removals are infrequent relative to
          // additions (cf. protocol-acceleration Resolver VersionChanged).
          await context.ensDb.sql
            .delete(ensIndexerSchema.efpListRecordTags)
            .where(
              and(
                eq(ensIndexerSchema.efpListRecordTags.chainId, chainId),
                eq(ensIndexerSchema.efpListRecordTags.contractAddress, contractAddress),
                eq(ensIndexerSchema.efpListRecordTags.slot, slot),
                eq(ensIndexerSchema.efpListRecordTags.record, parsed.data.toLowerCase() as Hex),
              ),
            );
          return;
        }

        case EFP_OPCODE.ADD_TAG: {
          const tagOp = parseTagOp(parsed.data);
          if (!tagOp) return;
          await context.ensDb
            .insert(ensIndexerSchema.efpListRecordTags)
            .values({
              id: listRecordTagId(chainId, contractAddress, slot, tagOp.record, tagOp.tag),
              chainId,
              contractAddress,
              slot,
              record: tagOp.record,
              tag: tagOp.tag,
              createdAt: ts,
            })
            .onConflictDoNothing();
          return;
        }

        case EFP_OPCODE.REMOVE_TAG: {
          const tagOp = parseTagOp(parsed.data);
          if (!tagOp) return;
          await context.ensDb.delete(ensIndexerSchema.efpListRecordTags, {
            id: listRecordTagId(chainId, contractAddress, slot, tagOp.record, tagOp.tag),
          });
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
