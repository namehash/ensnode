import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, eq, inArray } from "drizzle-orm";
import type { ChainId, NormalizedAddress, TokenId } from "enssdk";

import di from "@/di";
import { builder } from "@/omnigraph-api/builder";
import {
  EMPTY_CONNECTION,
  orderPaginationBy,
  paginateBy,
} from "@/omnigraph-api/lib/connection-helpers";
import { cursors } from "@/omnigraph-api/lib/cursors";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import {
  ID_PAGINATED_CONNECTION_ARGS,
  PAGINATION_DEFAULT_MAX_SIZE,
  PAGINATION_DEFAULT_PAGE_SIZE,
} from "@/omnigraph-api/schema/constants";
import { EfpListRecordRef } from "@/omnigraph-api/schema/efp-list-record";

export const EfpListRef = builder.loadableObjectRef("EfpList", {
  load: (tokenIds: TokenId[]) => {
    const { ensDb, ensIndexerSchema } = di.context;
    return ensDb
      .select()
      .from(ensIndexerSchema.efpLists)
      .where(inArray(ensIndexerSchema.efpLists.tokenId, tokenIds));
  },
  // efp_lists is keyed by `tokenId`, not a synthetic `id`.
  toKey: (list) => list.tokenId,
  cacheResolved: true,
  sort: true,
});

export type EfpList = Exclude<typeof EfpListRef.$inferType, string>;

/**
 * Connection args paginated by a list NFT's `tokenId` (efp_lists has no synthetic `id` column).
 */
export const TOKEN_ID_PAGINATED_CONNECTION_ARGS = {
  toCursor: (list: { tokenId: TokenId }) => cursors.encode(list.tokenId),
  defaultSize: PAGINATION_DEFAULT_PAGE_SIZE,
  maxSize: PAGINATION_DEFAULT_MAX_SIZE,
} as const;

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
      description: "The ERC-721 token id of the list NFT.",
      type: "TokenId",
      nullable: false,
      resolve: (list) => list.tokenId,
    }),

    ////////////////
    // EfpList.owner
    ////////////////
    owner: t.field({
      description: "The current ERC-721 owner of the list NFT.",
      type: "Address",
      nullable: false,
      resolve: (list) => list.owner as NormalizedAddress,
    }),

    ///////////////
    // EfpList.user
    ///////////////
    user: t.field({
      description: "The address allowed to post records to this list.",
      type: "Address",
      nullable: true,
      resolve: (list) => (list.user ?? null) as NormalizedAddress | null,
    }),

    //////////////////
    // EfpList.manager
    //////////////////
    manager: t.field({
      description: "The address allowed to administer this list.",
      type: "Address",
      nullable: true,
      resolve: (list) => (list.manager ?? null) as NormalizedAddress | null,
    }),

    /////////////////////
    // EfpList.nftChainId
    /////////////////////
    nftChainId: t.field({
      description:
        "Chain id of the ListRegistry NFT (Base / 8453 on the mainnet namespace; otherwise the active namespace's EFP deployment chain, e.g. 31337 on the ens-test-env devnet).",
      type: "ChainId",
      nullable: false,
      resolve: (list) => list.nftChainId as ChainId,
    }),

    /////////////////////////////
    // EfpList.nftContractAddress
    /////////////////////////////
    nftContractAddress: t.field({
      description: "The ListRegistry contract address.",
      type: "Address",
      nullable: false,
      resolve: (list) => list.nftContractAddress as NormalizedAddress,
    }),

    //////////////////////////////////////
    // EfpList.listStorageLocationChainId
    //////////////////////////////////////
    listStorageLocationChainId: t.field({
      description: "Decoded list storage location: target chain id.",
      type: "ChainId",
      nullable: true,
      resolve: (list) => (list.listStorageLocationChainId ?? null) as ChainId | null,
    }),

    //////////////////////////////////////////////
    // EfpList.listStorageLocationContractAddress
    //////////////////////////////////////////////
    listStorageLocationContractAddress: t.field({
      description: "Decoded list storage location: target contract address.",
      type: "Address",
      nullable: true,
      resolve: (list) =>
        (list.listStorageLocationContractAddress ?? null) as NormalizedAddress | null,
    }),

    ///////////////////////////////////
    // EfpList.listStorageLocationSlot
    ///////////////////////////////////
    listStorageLocationSlot: t.field({
      description: "Decoded list storage location: target slot (bytes32).",
      type: "Hex",
      nullable: true,
      resolve: (list) => list.listStorageLocationSlot,
    }),

    ////////////////////
    // EfpList.createdAt
    ////////////////////
    createdAt: t.field({ type: "BigInt", nullable: false, resolve: (list) => list.createdAt }),

    ////////////////////
    // EfpList.updatedAt
    ////////////////////
    updatedAt: t.field({ type: "BigInt", nullable: false, resolve: (list) => list.updatedAt }),

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
        if (
          list.listStorageLocationChainId === null ||
          list.listStorageLocationContractAddress === null ||
          list.listStorageLocationSlot === null
        ) {
          return EMPTY_CONNECTION;
        }

        const scope = and(
          eq(ensIndexerSchema.efpListRecords.chainId, list.listStorageLocationChainId),
          eq(
            ensIndexerSchema.efpListRecords.contractAddress,
            list.listStorageLocationContractAddress,
          ),
          eq(ensIndexerSchema.efpListRecords.slot, list.listStorageLocationSlot),
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
