import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import type { Address } from "viem";

import * as schema from "@ensnode/ensnode-schema";
import type { DomainId, PermissionsUserId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { findDomains } from "@/graphql-api/lib/find-domains";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { rejectAnyErrors } from "@/graphql-api/lib/reject-any-errors";
import { AccountIdInput } from "@/graphql-api/schema/account-id";
import { AccountRegistryPermissionsRef } from "@/graphql-api/schema/account-registries-permissions";
import { AccountResolverPermissionsRef } from "@/graphql-api/schema/account-resolver-permissions";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { cursors } from "@/graphql-api/schema/cursors";
import { AccountDomainsWhereInput, DomainInterfaceRef } from "@/graphql-api/schema/domain";
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
    id: t.field({
      description: "TODO",
      type: "Address",
      nullable: false,
      resolve: (parent) => parent.id,
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
      args: {
        where: t.arg({ type: AccountDomainsWhereInput, required: false }),
      },
      resolve: (parent, args, context) =>
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          async ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) => {
            // construct query for relevant domains
            const domains = findDomains({ ...args.where, owner: parent.id });

            // execute with pagination constraints
            const results = await db
              .with(domains)
              .select()
              .from(domains)
              .where(
                and(
                  before ? lt(domains.id, cursors.decode<DomainId>(before)) : undefined,
                  after ? gt(domains.id, cursors.decode<DomainId>(after)) : undefined,
                ),
              )
              .orderBy(inverted ? desc(domains.id) : asc(domains.id))
              .limit(limit);

            // provide full Domain entities via dataloader
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
      args: {
        in: t.arg({ type: AccountIdInput }),
      },
      resolve: (parent, args, context) =>
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          async ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
            db.query.permissionsUser.findMany({
              where: (t, { lt, gt, and, eq }) =>
                and(
                  // this user's permissions
                  eq(t.user, parent.id),
                  // optionally filtered by contract
                  args.in
                    ? and(eq(t.chainId, args.in.chainId), eq(t.address, args.in.address))
                    : undefined,
                  // optionall filtered by cursor
                  before ? lt(t.id, cursors.decode<PermissionsUserId>(before)) : undefined,
                  after ? gt(t.id, cursors.decode<PermissionsUserId>(after)) : undefined,
                ),
              orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
              limit,
            }),
        ),
    }),

    ///////////////////////////////
    // Account.registryPermissions
    ///////////////////////////////
    // TODO: this returns all permissions in a registry, perhaps can provide api for non-token resources...
    registryPermissions: t.connection({
      description: "TODO",
      type: AccountRegistryPermissionsRef,
      resolve: (parent, args, context) =>
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          async ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) => {
            const results = await db
              .select({
                permissionsUser: schema.permissionsUser,
                registry: schema.registry,
              })
              .from(schema.permissionsUser)
              .innerJoin(
                schema.registry,
                and(
                  eq(schema.permissionsUser.chainId, schema.registry.chainId),
                  eq(schema.permissionsUser.address, schema.registry.address),
                ),
              )
              .where(
                and(
                  eq(schema.permissionsUser.user, parent.id),
                  before
                    ? lt(schema.permissionsUser.id, cursors.decode<PermissionsUserId>(before))
                    : undefined,
                  after
                    ? gt(schema.permissionsUser.id, cursors.decode<PermissionsUserId>(after))
                    : undefined,
                ),
              )
              .orderBy(inverted ? desc(schema.permissionsUser.id) : asc(schema.permissionsUser.id))
              .limit(limit);

            return results.map((result) => ({ id: result.permissionsUser.id, ...result }));
          },
        ),
    }),

    ///////////////////////////////
    // Account.resolverPermissions
    ///////////////////////////////
    resolverPermissions: t.connection({
      description: "TODO",
      type: AccountResolverPermissionsRef,
      resolve: (parent, args, context) =>
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          async ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) => {
            const results = await db
              .select({
                permissionsUser: schema.permissionsUser,
                resolver: schema.resolver,
              })
              .from(schema.permissionsUser)
              .innerJoin(
                schema.resolver,
                and(
                  eq(schema.permissionsUser.chainId, schema.resolver.chainId),
                  eq(schema.permissionsUser.address, schema.resolver.address),
                ),
              )
              .where(
                and(
                  eq(schema.permissionsUser.user, parent.id),
                  before
                    ? lt(schema.permissionsUser.id, cursors.decode<PermissionsUserId>(before))
                    : undefined,
                  after
                    ? gt(schema.permissionsUser.id, cursors.decode<PermissionsUserId>(after))
                    : undefined,
                ),
              )
              .orderBy(inverted ? desc(schema.permissionsUser.id) : asc(schema.permissionsUser.id))
              .limit(limit);

            return results.map((result) => ({ id: result.permissionsUser.id, ...result }));
          },
        ),
    }),
  }),
});
