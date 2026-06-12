import type { TokenId } from "enssdk";
import { listMetadataId, storageLocationId } from "enssdk/efp";
import { type Hex, isAddressEqual, zeroAddress } from "viem";

import { PluginName } from "@ensnode/ensnode-sdk";

import { EFP_LIST_METADATA_KEYS } from "@/lib/efp/constants";
import { metadataValueToAddress } from "@/lib/efp/list-metadata";
import { parseListStorageLocation } from "@/lib/efp/parse-list-storage-location";
import {
  addOnchainEventListener,
  ensIndexerSchema,
  type IndexingEngineContext,
} from "@/lib/indexing-engines/ponder";
import { logger } from "@/lib/logger";
import { namespaceContract } from "@/lib/plugin-helpers";

const pluginName = PluginName.EFP;

/**
 * Delete a storage-location reverse-index row only if it still points at `tokenId`.
 *
 * The reverse index (`efp_list_storage_locations`) records one list NFT per `(chainId, contract,
 * slot)` — its primary key. But a list's storage-location slot is arbitrary, attacker-settable bytes,
 * so two list NFTs can point at the same slot. To prevent one list clobbering or orphaning another's
 * mapping, the FIRST list to claim a slot owns its reverse row (see the upsert in
 * `UpdateListStorageLocation` below); a later list does not overwrite it. Every mutation of a reverse
 * row is therefore gated on ownership — this delete is a no-op unless the row still belongs to
 * `tokenId`.
 */
async function deleteStorageLocationIfOwnedBy(
  context: IndexingEngineContext,
  locationId: string,
  tokenId: TokenId,
): Promise<void> {
  const mapping = await context.ensDb.find(ensIndexerSchema.efpListStorageLocations, {
    id: locationId,
  });
  if (mapping?.tokenId === tokenId) {
    await context.ensDb.delete(ensIndexerSchema.efpListStorageLocations, { id: locationId });
  }
}

/**
 * Registers the EFP `ListRegistry` event handlers (Transfer, UpdateListStorageLocation).
 */
export default function () {
  // Transfer — mints/transfers a list NFT. Upsert the list row keyed by tokenId.
  addOnchainEventListener(
    namespaceContract(pluginName, "ListRegistry:Transfer"),
    async ({ context, event }) => {
      const ts = event.block.timestamp;
      const tokenId = event.args.tokenId;

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
          await deleteStorageLocationIfOwnedBy(
            context,
            storageLocationId(
              existing.listStorageLocationChainId,
              existing.listStorageLocationContractAddress,
              existing.listStorageLocationSlot,
            ),
            tokenId,
          );
        }
        await context.ensDb.delete(ensIndexerSchema.efpLists, { tokenId });
        // The list's `efp_list_records` rows are intentionally left in place: they mirror the
        // on-chain `ListRecords` contract (a burn does not clear them), and their
        // `EfpListRecord.list` back-ref resolves to null once the reverse mapping above is gone.
        return;
      }

      const owner = event.args.to.toLowerCase() as Hex;
      // A mint inserts the row; a later transfer of the same NFT updates only `owner`/`updatedAt`.
      // `createdAt`, `nftChainId`, and `nftContractAddress` are mint-time values left untouched on
      // conflict: an ERC-721 tokenId is unique for the ListRegistry's lifetime (a burned id is not
      // re-minted) and the NFT never changes chain or contract.
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
      const tokenId = event.args.tokenId;

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
          await deleteStorageLocationIfOwnedBy(context, oldLocationId, tokenId);
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

      const { chainId, contractAddress, slot } = parsed;
      const newLocationId = storageLocationId(chainId, contractAddress, slot);

      // If this list previously pointed at a different storage location, drop the stale reverse
      // mapping.
      let moved = false;
      if (oldLocationId !== null && oldLocationId !== newLocationId) {
        moved = true;
        await deleteStorageLocationIfOwnedBy(context, oldLocationId, tokenId);
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

      // Claim this slot's reverse mapping for the list. The slot is attacker-settable, so a
      // different list may already own this mapping; `onConflictDoNothing` keeps first-writer-wins —
      // an existing mapping is never overwritten — matching `deleteStorageLocationIfOwnedBy`.
      await context.ensDb
        .insert(ensIndexerSchema.efpListStorageLocations)
        .values({ id: newLocationId, chainId, contractAddress, slot, tokenId, updatedAt: ts })
        .onConflictDoNothing();

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
