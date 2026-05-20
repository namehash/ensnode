import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, count, eq, getTableColumns } from "drizzle-orm";
import type { Address } from "enssdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { builder } from "@/omnigraph-api/builder";
import { orderPaginationBy, paginateBy } from "@/omnigraph-api/lib/connection-helpers";
import { resolveFindDomains } from "@/omnigraph-api/lib/find-domains/find-domains-resolver";
import { resolveFindEvents } from "@/omnigraph-api/lib/find-events/find-events-resolver";
import { getModelId } from "@/omnigraph-api/lib/get-model-id";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { AccountIdInput } from "@/omnigraph-api/schema/account-id";
import { ID_PAGINATED_CONNECTION_ARGS } from "@/omnigraph-api/schema/constants";
import { DomainInterfaceRef } from "@/omnigraph-api/schema/domain";
import { AccountDomainsWhereInput, DomainsOrderInput } from "@/omnigraph-api/schema/domain-inputs";
import { EventRef } from "@/omnigraph-api/schema/event";
import { AccountEventsWhereInput } from "@/omnigraph-api/schema/event-inputs";
import { PermissionsUserRef } from "@/omnigraph-api/schema/permissions";
import { RegistryPermissionsUserRef } from "@/omnigraph-api/schema/registry-permissions-user";
import { ResolverPermissionsUserRef } from "@/omnigraph-api/schema/resolver-permissions-user";

export const AccountRef = builder.loadableObjectRef("Account", {
  load: (ids: Address[]) =>
    ensDb.query.account.findMany({
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
      resolve: (parent, { where, order, ...connectionArgs }, context) =>
        resolveFindDomains(context, {
          where: { ...where, ownerId: parent.id },
          order,
          ...connectionArgs,
        }),
    }),

    //////////////////
    // Account.events
    //////////////////
    events: t.connection({
      description:
        "All Events for which this Account is the HCA-aware `sender` (i.e. `Event.sender`).",
      type: EventRef,
      args: {
        where: t.arg({ type: AccountEventsWhereInput }),
      },
      resolve: (parent, args) =>
        resolveFindEvents({
          ...args,
          where: { ...args.where, sender: { eq: parent.id } },
        }),
    }),

    ///////////////////////
    // Account.permissions
    ///////////////////////
    permissions: t.connection({
      description:
        "The Permissions granted to this Account, optionally filtered to Permissions in a specific contract.",
      type: PermissionsUserRef,
      args: {
        where: t.arg({ type: AccountPermissionsWhereInput }),
      },
      resolve: (parent, args) => {
        const contract = args.where?.contract;
        const scope = and(
          // this user's permissions
          eq(ensIndexerSchema.permissionsUser.user, parent.id),
          // optionally filtered by contract
          contract
            ? and(
                eq(ensIndexerSchema.permissionsUser.chainId, contract.chainId),
                eq(ensIndexerSchema.permissionsUser.address, contract.address),
              )
            : undefined,
        );

        return lazyConnection({
          totalCount: () => ensDb.$count(ensIndexerSchema.permissionsUser, scope),
          connection: () =>
            resolveCursorConnection(
              { ...ID_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                ensDb
                  .select()
                  .from(ensIndexerSchema.permissionsUser)
                  .where(and(scope, paginateBy(ensIndexerSchema.permissionsUser.id, before, after)))
                  .orderBy(orderPaginationBy(ensIndexerSchema.permissionsUser.id, inverted))
                  .limit(limit),
            ),
        });
      },
    }),

    ///////////////////////////////
    // Account.registryPermissions
    ///////////////////////////////
    registryPermissions: t.connection({
      description: "The Permissions on Registries granted to this Account.",
      type: RegistryPermissionsUserRef,
      resolve: (parent, args) => {
        const scope = eq(ensIndexerSchema.permissionsUser.user, parent.id);
        const join = and(
          eq(ensIndexerSchema.permissionsUser.chainId, ensIndexerSchema.registry.chainId),
          eq(ensIndexerSchema.permissionsUser.address, ensIndexerSchema.registry.address),
        );

        return lazyConnection({
          totalCount: () =>
            ensDb
              .select({ count: count() })
              .from(ensIndexerSchema.permissionsUser)
              .innerJoin(ensIndexerSchema.registry, join)
              .where(scope)
              .then((r) => r[0].count),
          connection: () =>
            resolveCursorConnection(
              { ...ID_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                ensDb
                  .select(getTableColumns(ensIndexerSchema.permissionsUser))
                  .from(ensIndexerSchema.permissionsUser)
                  .innerJoin(ensIndexerSchema.registry, join)
                  .where(and(scope, paginateBy(ensIndexerSchema.permissionsUser.id, before, after)))
                  .orderBy(orderPaginationBy(ensIndexerSchema.permissionsUser.id, inverted))
                  .limit(limit),
            ),
        });
      },
    }),

    ///////////////////////////////
    // Account.resolverPermissions
    ///////////////////////////////
    resolverPermissions: t.connection({
      description: "The Permissions on Resolvers granted to this Account.",
      type: ResolverPermissionsUserRef,
      resolve: (parent, args) => {
        const scope = eq(ensIndexerSchema.permissionsUser.user, parent.id);
        const join = and(
          eq(ensIndexerSchema.permissionsUser.chainId, ensIndexerSchema.resolver.chainId),
          eq(ensIndexerSchema.permissionsUser.address, ensIndexerSchema.resolver.address),
        );

        return lazyConnection({
          totalCount: () =>
            ensDb
              .select({ count: count() })
              .from(ensIndexerSchema.permissionsUser)
              .innerJoin(ensIndexerSchema.resolver, join)
              .where(scope)
              .then((r) => r[0].count),
          connection: () =>
            resolveCursorConnection(
              { ...ID_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                ensDb
                  .select(getTableColumns(ensIndexerSchema.permissionsUser))
                  .from(ensIndexerSchema.permissionsUser)
                  .innerJoin(ensIndexerSchema.resolver, join)
                  .where(and(scope, paginateBy(ensIndexerSchema.permissionsUser.id, before, after)))
                  .orderBy(orderPaginationBy(ensIndexerSchema.permissionsUser.id, inverted))
                  .limit(limit),
            ),
        });
      },
    }),
  }),
});

//////////
// Inputs
//////////

export const AccountByInput = builder.inputType("AccountByInput", {
  description: "Address an Account by ID or Address.",
  isOneOf: true,
  fields: (t) => ({
    id: t.field({ type: "Address" }),
    address: t.field({ type: "Address" }),
  }),
});

export const AccountPermissionsWhereInput = builder.inputType("AccountPermissionsWhereInput", {
  description: "Filter for Account.permissions.",
  fields: (t) => ({
    contract: t.field({
      type: AccountIdInput,
      description: "If set, filters this Account's Permissions to those granted in this contract.",
    }),
  }),
});
