import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, eq } from "drizzle-orm";
import type { NormalizedAddress } from "enssdk";
import type { Hex } from "viem";

import di from "@/di";
import { builder } from "@/omnigraph-api/builder";
import { orderPaginationBy, paginateBy } from "@/omnigraph-api/lib/connection-helpers";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { EfpListRef, TOKEN_ID_PAGINATED_CONNECTION_ARGS } from "@/omnigraph-api/schema/efp-list";
import { resolveValidatedPrimaryListTokenId } from "@/omnigraph-api/schema/efp-primary-list";

/**
 * `AccountEfp` is the account-rooted view of Ethereum Follow Protocol data, reached via
 * `Account.efp`. Its parent is the account's address, and every field is keyed on the EFP `user`
 * role (the account a list represents). Protocol-rooted queries (a list by token id, "who follows
 * this address") remain on the root `efp` namespace.
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
                  .where(and(scope, paginateBy(ensIndexerSchema.efpLists.tokenId, before, after)))
                  .orderBy(orderPaginationBy(ensIndexerSchema.efpLists.tokenId, inverted))
                  .limit(limit),
            ),
        });
      },
    }),
  }),
});
