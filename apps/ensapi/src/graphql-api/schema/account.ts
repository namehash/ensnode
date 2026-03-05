import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, count, eq } from "drizzle-orm";
import type { Address } from "viem";

import * as schema from "@ensnode/ensnode-schema";

import { builder } from "@/graphql-api/builder";
import { orderPaginationBy, paginateBy } from "@/graphql-api/lib/connection-helpers";
import { resolveFindDomains } from "@/graphql-api/lib/find-domains/find-domains-resolver";
import {
  domainsBase,
  filterByCanonical,
  filterByName,
  filterByOwner,
  withOrderingMetadata,
} from "@/graphql-api/lib/find-domains/layers";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { lazyConnection } from "@/graphql-api/lib/lazy-connection";
import { AccountIdInput } from "@/graphql-api/schema/account-id";
import { AccountRegistryPermissionsRef } from "@/graphql-api/schema/account-registries-permissions";
import { AccountResolverPermissionsRef } from "@/graphql-api/schema/account-resolver-permissions";
import { ID_PAGINATED_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
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
      resolve: (parent, args) => {
        const scope = and(
          // this user's permissions
          eq(schema.permissionsUser.user, parent.id),
          // optionally filtered by contract
          args.in
            ? and(
                eq(schema.permissionsUser.chainId, args.in.chainId),
                eq(schema.permissionsUser.address, args.in.address),
              )
            : undefined,
        );

        return lazyConnection({
          totalCount: () => db.$count(schema.permissionsUser, scope),
          connection: () =>
            resolveCursorConnection(
              { ...ID_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                db
                  .select()
                  .from(schema.permissionsUser)
                  .where(and(scope, paginateBy(schema.permissionsUser.id, before, after)))
                  .orderBy(orderPaginationBy(schema.permissionsUser.id, inverted))
                  .limit(limit),
            ),
        });
      },
    }),

    ///////////////////////////////
    // Account.registryPermissions
    ///////////////////////////////
    // TODO: this returns all permissions in a registry, perhaps can provide api for non-token resources...
    registryPermissions: t.connection({
      description: "The Permissions on Registries granted to this Account.",
      type: AccountRegistryPermissionsRef,
      resolve: (parent, args) => {
        const scope = eq(schema.permissionsUser.user, parent.id);
        const join = and(
          eq(schema.permissionsUser.chainId, schema.registry.chainId),
          eq(schema.permissionsUser.address, schema.registry.address),
        );

        return lazyConnection({
          totalCount: () =>
            db
              .select({ count: count() })
              .from(schema.permissionsUser)
              .innerJoin(schema.registry, join)
              .where(scope)
              .then((r) => r[0].count),
          connection: () =>
            resolveCursorConnection(
              { ...ID_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                db
                  .select({
                    permissionsUser: schema.permissionsUser,
                    registry: schema.registry,
                  })
                  .from(schema.permissionsUser)
                  .innerJoin(schema.registry, join)
                  .where(and(scope, paginateBy(schema.permissionsUser.id, before, after)))
                  .orderBy(orderPaginationBy(schema.permissionsUser.id, inverted))
                  .limit(limit)
                  .then((rows) => rows.map((r) => ({ id: r.permissionsUser.id, ...r }))),
            ),
        });
      },
    }),

    ///////////////////////////////
    // Account.resolverPermissions
    ///////////////////////////////
    resolverPermissions: t.connection({
      description: "The Permissions on Resolvers granted to this Account.",
      type: AccountResolverPermissionsRef,
      resolve: (parent, args) => {
        const scope = eq(schema.permissionsUser.user, parent.id);
        const join = and(
          eq(schema.permissionsUser.chainId, schema.resolver.chainId),
          eq(schema.permissionsUser.address, schema.resolver.address),
        );

        return lazyConnection({
          totalCount: () =>
            db
              .select({ count: count() })
              .from(schema.permissionsUser)
              .innerJoin(schema.resolver, join)
              .where(scope)
              .then((r) => r[0].count),
          connection: () =>
            resolveCursorConnection(
              { ...ID_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                db
                  .select({
                    permissionsUser: schema.permissionsUser,
                    resolver: schema.resolver,
                  })
                  .from(schema.permissionsUser)
                  .innerJoin(schema.resolver, join)
                  .where(and(scope, paginateBy(schema.permissionsUser.id, before, after)))
                  .orderBy(orderPaginationBy(schema.permissionsUser.id, inverted))
                  .limit(limit)
                  .then((rows) => rows.map((r) => ({ id: r.permissionsUser.id, ...r }))),
            ),
        });
      },
    }),
  }),
});
