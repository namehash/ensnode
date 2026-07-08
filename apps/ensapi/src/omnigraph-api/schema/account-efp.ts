import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, eq } from "drizzle-orm";
import type { NormalizedAddress } from "enssdk";

import { interpretMetadataKey } from "@ensnode/ensnode-sdk/internal";

import di from "@/di";
import { builder } from "@/omnigraph-api/builder";
import {
  orderPaginationBy,
  paginateBy,
  paginateByBigInt,
} from "@/omnigraph-api/lib/connection-helpers";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { AccountRef } from "@/omnigraph-api/schema/account";
import {
  ADDRESS_PAGINATED_CONNECTION_ARGS,
  ID_PAGINATED_CONNECTION_ARGS,
  TOKEN_ID_PAGINATED_CONNECTION_ARGS,
} from "@/omnigraph-api/schema/constants";
import { EfpAccountMetadataRef } from "@/omnigraph-api/schema/efp-account-metadata";
import {
  buildFollowingScope,
  countFollowers,
  fetchFollowers,
} from "@/omnigraph-api/schema/efp-follows";
import { EfpListRef } from "@/omnigraph-api/schema/efp-list";
import { resolveValidatedPrimaryListTokenId } from "@/omnigraph-api/schema/efp-primary-list";

/**
 * `AccountEfp` is the account-rooted view of Ethereum Follow Protocol data, reached via
 * `Account.efp`. Its parent is the account's address: the list fields are keyed on the EFP `user`
 * role (the account a list represents) and the metadata fields on the account address. Protocol-
 * rooted queries (a list by token id, "who follows this address") remain on the root `efp` namespace.
 */
export const AccountEfpRef = builder.objectRef<NormalizedAddress>("AccountEfp");

AccountEfpRef.implement({
  description: "An account's Ethereum Follow Protocol (EFP) presence.",
  fields: (t) => ({
    /////////////////////////////
    // AccountEfp.primaryList
    /////////////////////////////
    primaryList: t.field({
      description:
        "The account's validated primary EFP list: the list named by its `primary-list` metadata, returned only if that list's `user` role matches the account (the EFP two-step Primary List validation). Null if unset or unvalidated.",
      type: EfpListRef,
      nullable: true,
      resolve: (address) => resolveValidatedPrimaryListTokenId(address),
    }),

    ////////////////////////
    // AccountEfp.following
    ////////////////////////
    following: t.connection({
      description:
        "The accounts this account follows: the address records in its validated primary EFP list, excluding `block`/`mute`-tagged records. Empty when the account has no validated primary list.",
      type: AccountRef,
      resolve: async (address, args) => {
        const { ensDb, ensIndexerSchema } = di.context;
        // Both `totalCount` and the page query depend on this scope, and selecting the connection
        // means at least one of them is read, so resolve it once up front rather than lazily.
        const where = await buildFollowingScope(address);

        return lazyConnection({
          totalCount: () => ensDb.$count(ensIndexerSchema.efpListRecords, where),
          connection: () =>
            resolveCursorConnection(
              { ...ADDRESS_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                ensDb
                  .select({ recordData: ensIndexerSchema.efpListRecords.recordData })
                  .from(ensIndexerSchema.efpListRecords)
                  .where(
                    and(
                      where,
                      paginateBy(ensIndexerSchema.efpListRecords.recordData, before, after),
                    ),
                  )
                  .orderBy(orderPaginationBy(ensIndexerSchema.efpListRecords.recordData, inverted))
                  .limit(limit)
                  .then((rows) => rows.map((row) => row.recordData)),
            ),
        });
      },
    }),

    ////////////////////////
    // AccountEfp.followers
    ////////////////////////
    followers: t.connection({
      description:
        "The accounts that follow this account: those whose validated primary EFP list holds this account as a non-`block`/`mute` record.",
      type: AccountRef,
      resolve: (address, args) =>
        lazyConnection({
          totalCount: () => countFollowers(address),
          connection: () =>
            resolveCursorConnection(
              { ...ADDRESS_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                fetchFollowers(address, { before, after, limit, inverted }),
            ),
        }),
    }),

    ////////////////////////
    // AccountEfp.lists
    ////////////////////////
    lists: t.connection({
      description: "The EFP lists this account is the `user` of (the lists representing it).",
      type: EfpListRef,
      resolve: (address, args) => {
        const { ensDb, ensIndexerSchema } = di.context;
        const scope = eq(ensIndexerSchema.efpLists.user, address);

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

    ////////////////////////
    // AccountEfp.metadata
    ////////////////////////
    metadata: t.field({
      description:
        'Get one of this account\'s EFP account-metadata values by key (e.g. "primary-list").',
      type: EfpAccountMetadataRef,
      nullable: true,
      args: { key: t.arg({ type: "String", required: true }) },
      resolve: async (address, args) => {
        const { ensDb } = di.context;
        // A NULL-byte key is never stored (rejected on write), so it can never match — short-circuit.
        const key = interpretMetadataKey(args.key);
        if (key === null) return null;
        // Return the full row so the loadable ref resolves it directly, with no second fetch by id.
        const row = await ensDb.query.efpAccountMetadata.findFirst({
          where: (m, { and, eq }) => and(eq(m.address, address), eq(m.key, key)),
        });
        return row ?? null;
      },
    }),

    ////////////////////////
    // AccountEfp.metadatas
    ////////////////////////
    metadatas: t.connection({
      description: "All of this account's EFP account-metadata entries.",
      type: EfpAccountMetadataRef,
      resolve: (address, args) => {
        const { ensDb, ensIndexerSchema } = di.context;
        const scope = eq(ensIndexerSchema.efpAccountMetadata.address, address);

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
  }),
});
