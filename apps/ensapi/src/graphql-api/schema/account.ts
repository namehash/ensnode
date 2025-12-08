import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import type { Address } from "viem";

import * as schema from "@ensnode/ensnode-schema";
import type { PermissionsUserId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { rejectAnyErrors } from "@/graphql-api/lib/reject-any-errors";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { cursors } from "@/graphql-api/schema/cursors";
import { DomainInterfaceRef } from "@/graphql-api/schema/domain";
import { PermissionsUserRef } from "@/graphql-api/schema/permissions";
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

///////////
// Account
///////////
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
      resolve: (parent, args, context) =>
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          async ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) => {
            const v1Domains = db
              .select({ id: schema.v1Domain.id })
              .from(schema.v1Domain)
              .where(eq(schema.v1Domain.ownerId, parent.id))
              .leftJoin(schema.label, eq(schema.v1Domain.labelHash, schema.label.labelHash));

            const v2Domains = db
              .select({ id: schema.v2Domain.id })
              .from(schema.v2Domain)
              .where(eq(schema.v2Domain.ownerId, parent.id))
              .leftJoin(schema.label, eq(schema.v2Domain.labelHash, schema.label.labelHash));

            // use any to ignore id column type mismatch (ENSv1DomainId & ENSv2DomainId)
            const domains = db.$with("domains").as(unionAll(v1Domains, v2Domains as any));

            const results = await db
              .with(domains)
              .select()
              .from(domains)
              .where(
                and(
                  ...[
                    // TODO: using any because drizzle infers id as ENSv1DomainId
                    before && lt(domains.id, cursors.decode<any>(before)),
                    after && gt(domains.id, cursors.decode<any>(after)),
                  ].filter((c) => !!c),
                ),
              )
              .orderBy(inverted ? desc(domains.id) : asc(domains.id))
              .limit(limit);

            return rejectAnyErrors(
              DomainInterfaceRef.getDataloader(context).loadMany(
                results.map((result) => result.id),
              ),
            );
          },
        ),
    }),

    ///////////////////////
    // Account.permissions
    ///////////////////////
    permissions: t.connection({
      description: "TODO",
      type: PermissionsUserRef,
      // TODO: allow permissions(in: { contract: { chainId, address } })
      // or permissions(type: 'Registry' | 'Resolver')
      // and then join (chainId, address) against Registry/Resolver index to see what it refers to
      // and then filter on that — pretty expensive-sounding
      // args: {},
      resolve: (parent, args, context) =>
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          async ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
            db.query.permissionsUser.findMany({
              where: (t, { lt, gt, and, eq }) =>
                and(
                  ...[
                    eq(t.user, parent.id),
                    before !== undefined && lt(t.id, cursors.decode<PermissionsUserId>(before)),
                    after !== undefined && gt(t.id, cursors.decode<PermissionsUserId>(after)),
                  ].filter((c) => !!c),
                ),
              orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
              limit,
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
    // TODO: account's dedicated resolvers via EAC
  }),
});
