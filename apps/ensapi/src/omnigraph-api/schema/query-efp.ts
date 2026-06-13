import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, eq } from "drizzle-orm";

import { PluginName } from "@ensnode/ensnode-sdk";

import di from "@/di";
import { builder } from "@/omnigraph-api/builder";
import {
  orderPaginationBy,
  paginateBy,
  paginateByBigInt,
} from "@/omnigraph-api/lib/connection-helpers";
import { isPluginEnabled } from "@/omnigraph-api/lib/is-plugin-enabled";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { ID_PAGINATED_CONNECTION_ARGS } from "@/omnigraph-api/schema/constants";
import { EfpListRef, TOKEN_ID_PAGINATED_CONNECTION_ARGS } from "@/omnigraph-api/schema/efp-list";
import { EfpListRecordRef } from "@/omnigraph-api/schema/efp-list-record";

//////////////////////
// Inputs
//////////////////////

/** Identifies a single EFP list. */
const EfpListByInput = builder.inputType("EfpListByInput", {
  description: "Identify an EFP list by its NFT token id.",
  fields: (t) => ({
    tokenId: t.field({
      type: "TokenId",
      required: true,
      description: "The ERC-721 token id of the list NFT.",
    }),
  }),
});

/** Filters for the `efp.lists` connection. */
const EfpListsWhereInput = builder.inputType("EfpListsWhereInput", {
  description: "Filter EFP lists by their owner, user, or manager address.",
  fields: (t) => ({
    owner: t.field({ type: "Address", description: "The ERC-721 owner of the list NFT." }),
    user: t.field({ type: "Address", description: "The address allowed to post records." }),
    manager: t.field({
      type: "Address",
      description: "The address allowed to administer the list.",
    }),
  }),
});

/** Filters for the `efp.listRecords` connection. */
const EfpListRecordsWhereInput = builder.inputType("EfpListRecordsWhereInput", {
  description: "Filter EFP list records.",
  fields: (t) => ({
    recordData: t.field({
      type: "Address",
      description:
        "The target address of an address record (recordType 1). Filtering by this answers 'which lists follow this address?'.",
    }),
    recordType: t.field({ type: "Int", description: "The EFP record type (1 = address)." }),
  }),
});

/**
 * `EfpQuery` namespaces the protocol-rooted Ethereum Follow Protocol (EFP) queries (a list by token
 * id, lists by owner/user/manager, "who follows this address") under a single root `efp` field.
 * Account-rooted EFP queries (an account's primary list, the lists it is the `user` of, its account
 * metadata) live on `Account.efp`.
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
      args: { by: t.arg({ type: EfpListByInput, required: true }) },
      resolve: (_parent, args) => args.by.tokenId,
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
          where?.owner ? eq(ensIndexerSchema.efpLists.owner, where.owner) : undefined,
          where?.user ? eq(ensIndexerSchema.efpLists.user, where.user) : undefined,
          where?.manager ? eq(ensIndexerSchema.efpLists.manager, where.manager) : undefined,
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
                  .where(and(scope, paginateByBigInt(ensIndexerSchema.efpLists.id, before, after)))
                  .orderBy(orderPaginationBy(ensIndexerSchema.efpLists.id, inverted))
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
            ? eq(ensIndexerSchema.efpListRecords.recordData, where.recordData)
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
  }),
});

///////////////////////////////////////
// Query.efp — the single EFP namespace
///////////////////////////////////////
builder.queryField("efp", (t) =>
  t.field({
    description:
      "Ethereum Follow Protocol (EFP) queries. Null when the connected ENSIndexer does not have the `efp` plugin enabled.",
    type: EfpQueryRef,
    nullable: true,
    resolve: () => (isPluginEnabled(PluginName.EFP) ? {} : null),
  }),
);
