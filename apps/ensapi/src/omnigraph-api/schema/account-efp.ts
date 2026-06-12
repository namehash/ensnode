import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, eq } from "drizzle-orm";
import type { NormalizedAddress } from "enssdk";
import type { Hex } from "viem";

import di from "@/di";
import { builder } from "@/omnigraph-api/builder";
import {
  orderPaginationBy,
  paginateBy,
  paginateByBigInt,
} from "@/omnigraph-api/lib/connection-helpers";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { AccountRef } from "@/omnigraph-api/schema/account";
import { ID_PAGINATED_CONNECTION_ARGS } from "@/omnigraph-api/schema/constants";
import { EfpAccountMetadataRef } from "@/omnigraph-api/schema/efp-account-metadata";
import {
  ADDRESS_PAGINATED_CONNECTION_ARGS,
  buildFollowingScope,
  countValidatedFollowers,
  fetchValidatedFollowers,
} from "@/omnigraph-api/schema/efp-follows";
import { EfpListRef, TOKEN_ID_PAGINATED_CONNECTION_ARGS } from "@/omnigraph-api/schema/efp-list";
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
        "The account's validated primary EFP list: the list named by its `primary-list` metadata, returned only if that list's `user` role matches the account (the EFP two-step Primary List validation). Null if unset, not indexed, or unvalidated.",
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
      resolve: (address, args) => {
        const { ensDb, ensIndexerSchema } = di.context;
        // `following` derives from the account's primary list; resolve that scope once and share it
        // between `totalCount` and the page query.
        let scope: ReturnType<typeof buildFollowingScope> | null = null;
        const followingScope = () => {
          if (scope === null) scope = buildFollowingScope(address);
          return scope;
        };

        return lazyConnection({
          totalCount: async () =>
            ensDb.$count(ensIndexerSchema.efpListRecords, await followingScope()),
          connection: async () => {
            const where = await followingScope();
            return resolveCursorConnection(
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
                  .then((rows) => rows.map((row) => row.recordData as NormalizedAddress)),
            );
          },
        });
      },
    }),

    ////////////////////////
    // AccountEfp.followers
    ////////////////////////
    followers: t.connection({
      description:
        "The accounts that follow this account: those whose validated primary EFP list holds this account as a non-`block`/`mute` record. `totalCount` enumerates every follower and can be expensive for highly-followed accounts.",
      type: AccountRef,
      resolve: (address, args) =>
        lazyConnection({
          totalCount: () => countValidatedFollowers(address),
          connection: () =>
            resolveCursorConnection(
              { ...ADDRESS_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                fetchValidatedFollowers(address, { before, after, limit, inverted }),
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
        const scope = eq(ensIndexerSchema.efpLists.user, address as Hex);

        return lazyConnection({
          totalCount: () => ensDb.$count(ensIndexerSchema.efpLists, scope),
          connection: () =>
            resolveCursorConnection(
              { ...TOKEN_ID_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                ensDb
                  .select()
                  .from(ensIndexerSchema.efpLists)
                  .where(
                    and(scope, paginateByBigInt(ensIndexerSchema.efpLists.tokenId, before, after)),
                  )
                  .orderBy(orderPaginationBy(ensIndexerSchema.efpLists.tokenId, inverted))
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
        const { ensDb, ensIndexerSchema } = di.context;
        // (address, key) identifies the row; the PK also includes the AccountMetadata contract's
        // chainId, which the API doesn't carry, so query the indexed columns. Return the full row so
        // the loadable ref resolves it directly, with no second fetch by id.
        const [row] = await ensDb
          .select()
          .from(ensIndexerSchema.efpAccountMetadata)
          .where(
            and(
              eq(ensIndexerSchema.efpAccountMetadata.address, address as Hex),
              eq(ensIndexerSchema.efpAccountMetadata.key, args.key),
            ),
          )
          .limit(1);
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
        const scope = eq(ensIndexerSchema.efpAccountMetadata.address, address as Hex);

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
