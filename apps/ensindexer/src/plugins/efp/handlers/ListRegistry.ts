import { type Hex, isAddressEqual, zeroAddress } from "viem";

import { PluginName } from "@ensnode/ensnode-sdk";

import { addOnchainEventListener, ensIndexerSchema } from "@/lib/indexing-engines/ponder";
import { logger } from "@/lib/logger";
import { namespaceContract } from "@/lib/plugin-helpers";

import { EFP_LIST_METADATA_KEYS } from "../constants";
import { listMetadataId, storageLocationId } from "../lib/ids";
import { metadataValueToAddress } from "../lib/list-metadata";
import { parseListStorageLocation } from "../lib/parse-list-storage-location";

const pluginName = PluginName.EFP;

/**
 * Registers the EFP `ListRegistry` event handlers (Transfer, UpdateListStorageLocation).
 */
export default function () {
  // Transfer — mints/transfers a list NFT. Upsert the list row keyed by tokenId.
  addOnchainEventListener(
    namespaceContract(pluginName, "ListRegistry:Transfer"),
    async ({ context, event }) => {
      const ts = event.block.timestamp;
      const tokenId = event.args.tokenId.toString();

      // ERC-721 mints are Transfer(from=0) and burns are Transfer(to=0). On a burn the list NFT no
      // longer exists, so drop the list row (and its storage-location reverse mapping) rather than
      // record a zero-address owner that would surface through `EfpList.owner` and `lists(where:)`.
      if (isAddressEqual(event.args.to, zeroAddress)) {
        const existing = await context.ensDb.find(ensIndexerSchema.efpLists, { tokenId });
        if (
          existing?.listStorageLocationChainId != null &&
          existing.listStorageLocationContractAddress != null &&
          existing.listStorageLocationSlot != null
        ) {
          await context.ensDb.delete(ensIndexerSchema.efpListStorageLocations, {
            id: storageLocationId(
              existing.listStorageLocationChainId,
              existing.listStorageLocationContractAddress,
              existing.listStorageLocationSlot,
            ),
          });
        }
        await context.ensDb.delete(ensIndexerSchema.efpLists, { tokenId });
        // The list's `efp_list_records` rows are intentionally left in place: they mirror the
        // on-chain `ListRecords` contract (a burn does not clear them), and their
        // `EfpListRecord.list` back-ref resolves to null once the reverse mapping above is gone.
        return;
      }

      const owner = event.args.to.toLowerCase() as Hex;
      await context.ensDb
        .insert(ensIndexerSchema.efpLists)
        .values({
          tokenId,
          owner,
          nftChainId: context.chain.id,
          nftContractAddress: event.log.address.toLowerCase() as Hex,
          createdAt: ts,
          updatedAt: ts,
        })
        .onConflictDoUpdate({ owner, updatedAt: ts });
    },
  );

  // UpdateListStorageLocation — (re-)points a list at its record store.
  addOnchainEventListener(
    namespaceContract(pluginName, "ListRegistry:UpdateListStorageLocation"),
    async ({ context, event }) => {
      const ts = event.block.timestamp;
      const tokenId = event.args.tokenId.toString();

      // The mint Transfer always precedes this event (both fire on the ListRegistry on Base, in
      // order), so the list row exists. Guard anyway so an unexpected ordering skips rather than
      // updating a non-existent row.
      const existing = await context.ensDb.find(ensIndexerSchema.efpLists, { tokenId });
      if (!existing) return;

      const oldLocationId =
        existing.listStorageLocationChainId != null &&
        existing.listStorageLocationContractAddress != null &&
        existing.listStorageLocationSlot != null
          ? storageLocationId(
              existing.listStorageLocationChainId,
              existing.listStorageLocationContractAddress,
              existing.listStorageLocationSlot,
            )
          : null;

      const parsed = parseListStorageLocation(event.args.listStorageLocation);

      // An undecodable payload (future version, non-onchain location type, or malformed) replaces
      // the on-chain location with something this indexer can't represent. Drop the stale decoded
      // location, its reverse mapping, and its location-scoped roles rather than keep resolving the
      // old slot; keep the raw payload for debugging.
      if (!parsed) {
        logger.warn({
          msg: `EFP UpdateListStorageLocation(tokenId=${tokenId}) has an undecodable payload; clearing the list's location`,
        });
        if (oldLocationId !== null) {
          await context.ensDb.delete(ensIndexerSchema.efpListStorageLocations, {
            id: oldLocationId,
          });
        }
        await context.ensDb.update(ensIndexerSchema.efpLists, { tokenId }).set({
          listStorageLocation: event.args.listStorageLocation,
          listStorageLocationChainId: null,
          listStorageLocationContractAddress: null,
          listStorageLocationSlot: null,
          user: null,
          manager: null,
          updatedAt: ts,
        });
        return;
      }

      const chainId = Number(parsed.chainId);
      const { contractAddress, slot } = parsed;
      const newLocationId = storageLocationId(chainId, contractAddress, slot);

      // If this list previously pointed at a different storage location, drop the stale reverse
      // mapping.
      let moved = false;
      if (oldLocationId !== null && oldLocationId !== newLocationId) {
        moved = true;
        await context.ensDb.delete(ensIndexerSchema.efpListStorageLocations, { id: oldLocationId });
      }

      await context.ensDb.update(ensIndexerSchema.efpLists, { tokenId }).set({
        listStorageLocation: event.args.listStorageLocation,
        listStorageLocationChainId: chainId,
        listStorageLocationContractAddress: contractAddress,
        listStorageLocationSlot: slot,
        // `user`/`manager` are scoped to the storage location. On a move, clear them so the list is
        // not attributed to the old location's roles; pending metadata for the new location
        // repopulates them in the drain below.
        ...(moved ? { user: null, manager: null } : {}),
        updatedAt: ts,
      });

      await context.ensDb
        .insert(ensIndexerSchema.efpListStorageLocations)
        .values({ id: newLocationId, chainId, contractAddress, slot, tokenId, updatedAt: ts })
        .onConflictDoUpdate({ tokenId, updatedAt: ts });

      // (Re-)apply this storage location's durable user/manager metadata to the list. Keyed by
      // location, so it restores roles whenever a list points at (or re-points to) a slot whose
      // metadata was already recorded; it is not deleted, as it stays valid for the slot. Combined
      // with the role clear on a move above, this rederives the list's roles from its location.
      for (const key of [EFP_LIST_METADATA_KEYS.USER, EFP_LIST_METADATA_KEYS.MANAGER] as const) {
        const meta = await context.ensDb.find(ensIndexerSchema.efpListMetadata, {
          id: listMetadataId(chainId, contractAddress, slot, key),
        });
        if (!meta) continue;

        const address = metadataValueToAddress(meta.value);
        await context.ensDb
          .update(ensIndexerSchema.efpLists, { tokenId })
          .set(
            key === EFP_LIST_METADATA_KEYS.USER
              ? { user: address, updatedAt: ts }
              : { manager: address, updatedAt: ts },
          );
      }
    },
  );
}
