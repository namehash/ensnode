import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import type { Address } from "viem";

import type { ENSv1DomainId, ENSv2DomainId, ResolverId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-id";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { cursors } from "@/graphql-api/schema/cursors";
import { ENSv1DomainRef, ENSv2DomainRef } from "@/graphql-api/schema/domain";
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
    // domains: t.connection({
    //   description: "TODO",
    //   type: DomainInterfaceRef,
    //   resolve: (parent, args, context) =>
    //     // TODO(dataloader) — confirm this is dataloaded?
    //     resolveCursorConnection(
    //       { ...DEFAULT_CONNECTION_ARGS, args },
    //       async ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) => {
    //         const v1Domains = db
    //           .select({ id: schema.v1Domain.id })
    //           .from(schema.v1Domain)
    //           .where(eq(schema.v1Domain.ownerId, parent.id))
    //           .leftJoin(schema.label, eq(schema.v1Domain.labelHash, schema.label.labelHash));

    //         const v2Domains = db
    //           .select({ id: schema.v2Domain.id })
    //           .from(schema.v2Domain)
    //           .where(eq(schema.v2Domain.ownerId, parent.id))
    //           .leftJoin(schema.label, eq(schema.v2Domain.labelHash, schema.label.labelHash));

    //         // @ts-expect-error ignore that id column types differ
    //         const domains = db.$with("domains").as(unionAll(v1Domains, v2Domains));

    //         const results = await db
    //           .with(domains)
    //           .select()
    //           .from(domains)
    //           .where(
    //             and(
    //               ...[
    //                 // TODO: using any because drizzle infers id as ENSv1DomainId
    //                 before && lt(domains.id, cursors.decode<any>(before)),
    //                 after && gt(domains.id, cursors.decode<any>(after)),
    //               ].filter((c) => !!c),
    //             ),
    //           )
    //           .orderBy(inverted ? desc(domains.id) : asc(domains.id))
    //           .limit(limit);

    //         return rejectAnyErrors(
    //           DomainInterfaceRef.getDataloader(context).loadMany(
    //             results.map((result) => result.id),
    //           ),
    //         );
    //       },
    //     ),
    // }),

    /////////////////////
    // Account.v1Domains
    /////////////////////
    v1Domains: t.connection({
      description: "TODO",
      type: ENSv1DomainRef,
      resolve: (parent, args, context) =>
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
            db.query.v1Domain.findMany({
              where: (t, { lt, gt, and, eq }) =>
                and(
                  ...[
                    eq(t.ownerId, parent.id),
                    before !== undefined && lt(t.id, cursors.decode<ENSv1DomainId>(before)),
                    after !== undefined && gt(t.id, cursors.decode<ENSv1DomainId>(after)),
                  ].filter((c) => !!c),
                ),
              orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
              limit,
              with: { label: true },
            }),
        ),
    }),

    /////////////////////
    // Account.v2Domains
    /////////////////////
    v2Domains: t.connection({
      description: "TODO",
      type: ENSv2DomainRef,
      resolve: (parent, args, context) =>
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
            db.query.v2Domain.findMany({
              where: (t, { lt, gt, and, eq }) =>
                and(
                  ...[
                    eq(t.ownerId, parent.id),
                    before !== undefined && lt(t.id, cursors.decode<ENSv2DomainId>(before)),
                    after !== undefined && gt(t.id, cursors.decode<ENSv2DomainId>(after)),
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
