import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, eq, inArray } from "drizzle-orm";
import type { ChainId, NormalizedAddress, TokenId } from "enssdk";
import type { Hex } from "viem";

import di from "@/di";
import { builder } from "@/omnigraph-api/builder";
import {
  EMPTY_CONNECTION,
  orderPaginationBy,
  paginateBy,
} from "@/omnigraph-api/lib/connection-helpers";
import { getModelId } from "@/omnigraph-api/lib/get-model-id";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { AccountIdRef } from "@/omnigraph-api/schema/account-id";
import { ID_PAGINATED_CONNECTION_ARGS } from "@/omnigraph-api/schema/constants";
import { EfpListRecordRef } from "@/omnigraph-api/schema/efp-list-record";

export const EfpListRef = builder.loadableObjectRef("EfpList", {
  load: (ids: TokenId[]) => {
    const { ensDb, ensIndexerSchema } = di.context;
    return ensDb
      .select()
      .from(ensIndexerSchema.efpLists)
      .where(inArray(ensIndexerSchema.efpLists.id, ids));
  },
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type EfpList = Exclude<typeof EfpListRef.$inferType, string>;

/**
 * The decoded `(chainId, contractAddress, slot)` onchain location of a list's records, or `null` if
 * the list has not emitted an `UpdateListStorageLocation` (or its payload was undecodable). The three
 * `listStorageLocation*` columns are written together, so they are all-or-nothing.
 */
export function decodedStorageLocation(list: {
  listStorageLocationChainId: ChainId | null;
  listStorageLocationContractAddress: NormalizedAddress | null;
  listStorageLocationSlot: Hex | null;
}): { chainId: ChainId; contractAddress: NormalizedAddress; slot: Hex } | null {
  if (
    list.listStorageLocationChainId === null ||
    list.listStorageLocationContractAddress === null ||
    list.listStorageLocationSlot === null
  ) {
    return null;
  }

  return {
    chainId: list.listStorageLocationChainId,
    contractAddress: list.listStorageLocationContractAddress,
    slot: list.listStorageLocationSlot,
  };
}

////////////////////////
// EfpListStorageLocation
////////////////////////
const EfpListStorageLocationRef = builder.objectRef<{
  chainId: ChainId;
  address: NormalizedAddress;
  slot: Hex;
}>("EfpListStorageLocation");

EfpListStorageLocationRef.implement({
  description:
    "The decoded onchain location of a list's records: a (chainId, ListRecords contract address, slot) tuple.",
  fields: (t) => ({
    chainId: t.field({ type: "ChainId", nullable: false, resolve: (loc) => loc.chainId }),
    address: t.field({
      description: "The ListRecords contract address holding the list's records.",
      type: "Address",
      nullable: false,
      resolve: (loc) => loc.address,
    }),
    slot: t.field({
      description: "The list's storage slot (bytes32) within the ListRecords contract.",
      type: "Hex",
      nullable: false,
      resolve: (loc) => loc.slot,
    }),
  }),
});

///////////
// EfpList
///////////
EfpListRef.implement({
  description: "An EFP list NFT (a ListRegistry token) and the records it holds.",
  fields: (t) => ({
    //////////////////
    // EfpList.tokenId
    //////////////////
    tokenId: t.field({
      description: "The ERC-721 TokenId of the list NFT.",
      type: "TokenId",
      nullable: false,
      resolve: (list) => list.id,
    }),

    ////////////////
    // EfpList.owner
    ////////////////
    owner: t.field({
      description: "The current ERC-721 owner of the list NFT.",
      type: "Address",
      nullable: false,
      resolve: (list) => list.owner,
    }),

    ///////////////
    // EfpList.user
    ///////////////
    user: t.field({
      description: "The address allowed to post records to this list.",
      type: "Address",
      nullable: true,
      resolve: (list) => list.user,
    }),

    //////////////////
    // EfpList.manager
    //////////////////
    manager: t.field({
      description: "The address allowed to administer this list.",
      type: "Address",
      nullable: true,
      resolve: (list) => list.manager,
    }),

    //////////////
    // EfpList.nft
    //////////////
    nft: t.field({
      description: "The list NFT's AccountId.",
      type: AccountIdRef,
      nullable: false,
      resolve: (list) => ({ chainId: list.nftChainId, address: list.nftContractAddress }),
    }),

    /////////////////////////
    // EfpList.storageLocation
    /////////////////////////
    storageLocation: t.field({
      description: "The decoded onchain location of this list's records, or null if not known.",
      type: EfpListStorageLocationRef,
      nullable: true,
      resolve: (list) => {
        const location = decodedStorageLocation(list);
        return (
          location && {
            chainId: location.chainId,
            address: location.contractAddress,
            slot: location.slot,
          }
        );
      },
    }),

    ////////////////////
    // EfpList.createdAt
    ////////////////////
    createdAt: t.field({
      description: "When this list was first indexed (Unix timestamp, seconds).",
      type: "BigInt",
      nullable: false,
      resolve: (list) => list.createdAt,
    }),

    ////////////////////
    // EfpList.updatedAt
    ////////////////////
    updatedAt: t.field({
      description: "When this list was last updated (Unix timestamp, seconds).",
      type: "BigInt",
      nullable: false,
      resolve: (list) => list.updatedAt,
    }),

    //////////////////
    // EfpList.records
    //////////////////
    records: t.connection({
      description: "The records currently in this list (the addresses it follows).",
      type: EfpListRecordRef,
      resolve: (list, args) => {
        const { ensDb, ensIndexerSchema } = di.context;

        // A list's records live at its decoded onchain storage location. If the list has not yet
        // emitted an UpdateListStorageLocation, it has no records to resolve.
        const location = decodedStorageLocation(list);
        if (!location) return EMPTY_CONNECTION;

        const scope = and(
          eq(ensIndexerSchema.efpListRecords.chainId, location.chainId),
          eq(ensIndexerSchema.efpListRecords.contractAddress, location.contractAddress),
          eq(ensIndexerSchema.efpListRecords.slot, location.slot),
        );

        return lazyConnection({
          totalCount: () => ensDb.$count(ensIndexerSchema.efpListRecords, scope),
          connection: () =>
            resolveCursorConnection(
              { ...ID_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                ensDb
                  .select()
                  .from(ensIndexerSchema.efpListRecords)
                  .where(and(scope, paginateBy(ensIndexerSchema.efpListRecords.id, before, after)))
                  .orderBy(orderPaginationBy(ensIndexerSchema.efpListRecords.id, inverted))
                  .limit(limit),
            ),
        });
      },
    }),
  }),
});
