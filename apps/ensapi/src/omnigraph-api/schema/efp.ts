import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, eq } from "drizzle-orm";
import type { Hex } from "viem";

import di from "@/di";
import { builder } from "@/omnigraph-api/builder";
import { orderPaginationBy, paginateBy } from "@/omnigraph-api/lib/connection-helpers";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { ID_PAGINATED_CONNECTION_ARGS } from "@/omnigraph-api/schema/constants";
import { EfpAccountMetadataRef } from "@/omnigraph-api/schema/efp-account-metadata";
import { efpAccountMetadataId } from "@/omnigraph-api/schema/efp-ids";
import {
  EfpAccountMetadatasWhereInput,
  EfpListRecordsWhereInput,
  EfpListsWhereInput,
} from "@/omnigraph-api/schema/efp-inputs";
import { EfpListRef, TOKEN_ID_PAGINATED_CONNECTION_ARGS } from "@/omnigraph-api/schema/efp-list";
import { EfpListRecordRef } from "@/omnigraph-api/schema/efp-list-record";

/** The EFP AccountMetadata key whose value is an account's primary-list token id. */
const EFP_PRIMARY_LIST_KEY = "primary-list";

/**
 * Decode a `primary-list` account-metadata value (an abi-encoded `uint256` token id) into a
 * decimal token-id string, or `null` if it isn't a well-formed value.
 */
function decodePrimaryListTokenId(value: Hex): string | null {
  if (!value || value === "0x") return null;
  try {
    return BigInt(value).toString();
  } catch {
    return null;
  }
}

/**
 * `EfpQuery` namespaces all Ethereum Follow Protocol (EFP) queries under a single root `efp` field,
 * keeping the EFP surface self-contained and the Query root uncluttered.
 */
const EfpQueryRef = builder.objectRef<Record<string, never>>("EfpQuery");

EfpQueryRef.implement({
  description: "Queries for Ethereum Follow Protocol (EFP) data.",
  fields: (t) => ({
    ///////////////
    // efp.list
    ///////////////
    list: t.field({
      description: "Get an EFP list by its NFT token id.",
      type: EfpListRef,
      nullable: true,
      args: { tokenId: t.arg({ type: "String", required: true }) },
      resolve: (_parent, args) => args.tokenId,
    }),

    ///////////////
    // efp.lists
    ///////////////
    lists: t.connection({
      description: "Find EFP lists, optionally filtered by owner / user / manager.",
      type: EfpListRef,
      args: { where: t.arg({ type: EfpListsWhereInput }) },
      resolve: (_parent, args) => {
        const { ensDb, ensIndexerSchema } = di.context;
        const where = args.where;
        const scope = and(
          where?.owner ? eq(ensIndexerSchema.efpLists.owner, where.owner as Hex) : undefined,
          where?.user ? eq(ensIndexerSchema.efpLists.user, where.user as Hex) : undefined,
          where?.manager ? eq(ensIndexerSchema.efpLists.manager, where.manager as Hex) : undefined,
        );

        return lazyConnection({
          totalCount: () => ensDb.$count(ensIndexerSchema.efpLists, scope),
          connection: () =>
            resolveCursorConnection(
              { ...TOKEN_ID_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                ensDb
                  .select()
                  .from(ensIndexerSchema.efpLists)
                  .where(and(scope, paginateBy(ensIndexerSchema.efpLists.tokenId, before, after)))
                  .orderBy(orderPaginationBy(ensIndexerSchema.efpLists.tokenId, inverted))
                  .limit(limit),
            ),
        });
      },
    }),

    /////////////////////
    // efp.listRecords
    /////////////////////
    listRecords: t.connection({
      description:
        "Find EFP list records. Filter by `recordData` to answer 'which lists follow this address?'.",
      type: EfpListRecordRef,
      args: { where: t.arg({ type: EfpListRecordsWhereInput }) },
      resolve: (_parent, args) => {
        const { ensDb, ensIndexerSchema } = di.context;
        const where = args.where;
        const scope = and(
          where?.recordData
            ? eq(ensIndexerSchema.efpListRecords.recordData, where.recordData as Hex)
            : undefined,
          where?.recordType != null
            ? eq(ensIndexerSchema.efpListRecords.recordType, where.recordType)
            : undefined,
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

    /////////////////////////
    // efp.accountMetadata
    /////////////////////////
    accountMetadata: t.field({
      description: "Get an EFP account-metadata value by address and key.",
      type: EfpAccountMetadataRef,
      nullable: true,
      args: {
        address: t.arg({ type: "Address", required: true }),
        key: t.arg({ type: "String", required: true }),
      },
      resolve: (_parent, args) => efpAccountMetadataId(args.address, args.key),
    }),

    //////////////////////////
    // efp.accountMetadatas
    //////////////////////////
    accountMetadatas: t.connection({
      description: "Find all EFP account-metadata entries for an address.",
      type: EfpAccountMetadataRef,
      args: { where: t.arg({ type: EfpAccountMetadatasWhereInput, required: true }) },
      resolve: (_parent, args) => {
        const { ensDb, ensIndexerSchema } = di.context;
        const scope = eq(ensIndexerSchema.efpAccountMetadata.address, args.where.address as Hex);

        return lazyConnection({
          totalCount: () => ensDb.$count(ensIndexerSchema.efpAccountMetadata, scope),
          connection: () =>
            resolveCursorConnection(
              { ...ID_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                ensDb
                  .select()
                  .from(ensIndexerSchema.efpAccountMetadata)
                  .where(
                    and(scope, paginateBy(ensIndexerSchema.efpAccountMetadata.id, before, after)),
                  )
                  .orderBy(orderPaginationBy(ensIndexerSchema.efpAccountMetadata.id, inverted))
                  .limit(limit),
            ),
        });
      },
    }),

    ///////////////////////
    // efp.primaryList
    ///////////////////////
    primaryList: t.field({
      description:
        "The account's validated primary EFP list: the list named by the account's `primary-list` metadata, returned only if that list's `user` role matches the account (the EFP two-step Primary List validation). Null if unset, not indexed, or unvalidated.",
      type: EfpListRef,
      nullable: true,
      args: { address: t.arg({ type: "Address", required: true }) },
      resolve: async (_parent, args) => {
        const { ensDb, ensIndexerSchema } = di.context;

        const [metadata] = await ensDb
          .select({ value: ensIndexerSchema.efpAccountMetadata.value })
          .from(ensIndexerSchema.efpAccountMetadata)
          .where(
            eq(
              ensIndexerSchema.efpAccountMetadata.id,
              efpAccountMetadataId(args.address, EFP_PRIMARY_LIST_KEY),
            ),
          )
          .limit(1);
        if (!metadata) return null;

        const tokenId = decodePrimaryListTokenId(metadata.value);
        if (tokenId === null) return null;

        // EFP "Primary List" is only valid when the named list's `user` role matches the account.
        const [list] = await ensDb
          .select({ user: ensIndexerSchema.efpLists.user })
          .from(ensIndexerSchema.efpLists)
          .where(eq(ensIndexerSchema.efpLists.tokenId, tokenId))
          .limit(1);
        // Compare case-insensitively: although the Address scalar already normalizes `args.address`,
        // lower-casing both sides keeps validation independent of input casing.
        if (!list?.user || list.user.toLowerCase() !== args.address.toLowerCase()) return null;

        return tokenId;
      },
    }),
  }),
});

///////////////////////////////////////
// Query.efp — the single EFP namespace
///////////////////////////////////////
builder.queryField("efp", (t) =>
  t.field({
    description: "Ethereum Follow Protocol (EFP) queries.",
    type: EfpQueryRef,
    nullable: false,
    resolve: () => ({}),
  }),
);
