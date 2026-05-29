import { type Hex, isAddressEqual, zeroAddress } from "viem";

import { PluginName } from "@ensnode/ensnode-sdk";

import { addOnchainEventListener, ensIndexerSchema } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";

import { EFP_LIST_METADATA_KEYS } from "../constants";
import { pendingListMetadataId, storageLocationId } from "../lib/ids";
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
      const parsed = parseListStorageLocation(event.args.listStorageLocation);
      if (!parsed) return;

      const ts = event.block.timestamp;
      const tokenId = event.args.tokenId.toString();
      const chainId = Number(parsed.chainId);
      const { contractAddress, slot } = parsed;
      const newLocationId = storageLocationId(chainId, contractAddress, slot);

      // If this list previously pointed at a different storage location, drop the stale reverse
      // mapping. (Relies on the mint Transfer preceding this event — both fire on the ListRegistry
      // on Base, so the list row already exists.)
      const existing = await context.ensDb.find(ensIndexerSchema.efpLists, { tokenId });
      let moved = false;
      if (
        existing?.listStorageLocationChainId != null &&
        existing.listStorageLocationContractAddress != null &&
        existing.listStorageLocationSlot != null
      ) {
        const oldLocationId = storageLocationId(
          existing.listStorageLocationChainId,
          existing.listStorageLocationContractAddress,
          existing.listStorageLocationSlot,
        );
        if (oldLocationId !== newLocationId) {
          moved = true;
          await context.ensDb.delete(ensIndexerSchema.efpListStorageLocations, {
            id: oldLocationId,
          });
        }
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

      // Drain any user/manager metadata staged before this storage location was known.
      for (const key of [EFP_LIST_METADATA_KEYS.USER, EFP_LIST_METADATA_KEYS.MANAGER] as const) {
        const id = pendingListMetadataId(chainId, contractAddress, slot, key);
        const pending = await context.ensDb.find(ensIndexerSchema.efpPendingListMetadata, { id });
        if (!pending) continue;

        const address = metadataValueToAddress(pending.value);
        await context.ensDb
          .update(ensIndexerSchema.efpLists, { tokenId })
          .set(
            key === EFP_LIST_METADATA_KEYS.USER
              ? { user: address, updatedAt: ts }
              : { manager: address, updatedAt: ts },
          );
        await context.ensDb.delete(ensIndexerSchema.efpPendingListMetadata, { id });
      }
    },
  );
}
