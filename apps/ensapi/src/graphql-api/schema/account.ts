import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import type { Address } from "viem";

import * as schema from "@ensnode/ensnode-schema";
import type { PermissionsUserId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { resolveFindDomains } from "@/graphql-api/lib/find-domains/find-domains-resolver";
import {
  domainsBase,
  filterByCanonical,
  filterByName,
  filterByOwner,
  withOrderingMetadata,
} from "@/graphql-api/lib/find-domains/layers";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { AccountIdInput } from "@/graphql-api/schema/account-id";
import { AccountRegistryPermissionsRef } from "@/graphql-api/schema/account-registries-permissions";
import { AccountResolverPermissionsRef } from "@/graphql-api/schema/account-resolver-permissions";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { cursors } from "@/graphql-api/schema/cursors";
import {
  AccountDomainsWhereInput,
  DomainInterfaceRef,
  DomainsOrderInput,
} from "@/graphql-api/schema/domain";
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
  description: "Represents an individual Account, keyed by its Address.",
  fields: (t) => ({
    //////////////
    // Account.id
    //////////////
    id: t.field({
      description: "A unique reference to this Account.",
      type: "Address",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ///////////////////
    // Account.address
    ///////////////////
    address: t.field({
      description: "An EVM Address that uniquely identifies this Account on-chain.",
      type: "Address",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ////////////////////
    // Account.domains
    ////////////////////
    domains: t.connection({
      description: "The Domains that are owned by the Account.",
      type: DomainInterfaceRef,
      args: {
        where: t.arg({ type: AccountDomainsWhereInput }),
        order: t.arg({ type: DomainsOrderInput }),
      },
      resolve: (parent, { where, order, ...connectionArgs }, context) => {
        const base = domainsBase();
        const owned = filterByOwner(base, parent.id);
        const named = filterByName(owned, where?.name);
        const canonical = where?.canonical === true ? filterByCanonical(named) : named;
        const domains = withOrderingMetadata(canonical);
        return resolveFindDomains(context, { domains, order, ...connectionArgs });
      },
    }),

    ///////////////////////
    // Account.permissions
    ///////////////////////
    permissions: t.connection({
      description: "The Permissions granted to this Account.",
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
      description: "The Permissions on Registries granted to this Account.",
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
      description: "The Permissions on Resolvers granted to this Account.",
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
