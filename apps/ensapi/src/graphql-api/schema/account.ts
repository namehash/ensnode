import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import type { Address } from "viem";

import type { DomainId, ResolverId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-id";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { cursors } from "@/graphql-api/schema/cursors";
import { DomainInterfaceRef } from "@/graphql-api/schema/domain";
import { ResolverRef } from "@/graphql-api/schema/resolver";
import { db } from "@/lib/db";

export const AccountRef = builder.loadableObjectRef("Account", {
  load: (ids: Address[]) =>
    db.query.account.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
    }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type Account = Exclude<typeof AccountRef.$inferType, Address>;

AccountRef.implement({
  description: "TODO",
  fields: (t) => ({
    //////////////
    // Account.id
    //////////////
    id: t.expose("id", {
      description: "TODO",
      type: "Address",
      nullable: false,
    }),

    ///////////////////
    // Account.address
    ///////////////////
    address: t.field({
      description: "TODO",
      type: "Address",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ///////////////////
    // Account.domains
    ///////////////////
    domains: t.connection({
      description: "TODO",
      type: DomainInterfaceRef,
      resolve: (parent, args) =>
        // TODO(dataloader) — confirm this is dataloaded?
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
            db.query.domain.findMany({
              where: (t, { lt, gt, and, eq }) =>
                and(
                  ...[
                    eq(t.ownerId, parent.id),
                    before !== undefined && lt(t.id, cursors.decode<DomainId>(before)),
                    after !== undefined && gt(t.id, cursors.decode<DomainId>(after)),
                  ].filter((c) => !!c),
                ),
              orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
              limit,
              with: { label: true },
            }),
        ),
    }),

    //////////////////////
    // Account.registries
    //////////////////////
    // TODO: account's registries via EAC
    // similar logic for dedicatedResolvers

    //////////////////////////////
    // Account.dedicatedResolvers
    //////////////////////////////
    dedicatedResolvers: t.connection({
      description: "TODO",
      type: ResolverRef,
      resolve: (parent, args) =>
        // TODO(dataloader) — confirm this is dataloaded?
        // TODO(EAC) — migrate to Permissions lookup
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
            db.query.resolver.findMany({
              where: (t, { lt, gt, and, eq }) =>
                and(
                  ...[
                    eq(t.ownerId, parent.id),
                    before !== undefined && lt(t.id, cursors.decode<ResolverId>(before)),
                    after !== undefined && gt(t.id, cursors.decode<ResolverId>(after)),
                  ].filter((c) => !!c),
                ),
              orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
              limit,
            }),
        ),
    }),
  }),
});
