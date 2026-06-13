import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, count, eq, getTableColumns } from "drizzle-orm";
import type { NormalizedAddress } from "enssdk";

import di from "@/di";
import { builder } from "@/omnigraph-api/builder";
import { orderPaginationBy, paginateBy } from "@/omnigraph-api/lib/connection-helpers";
import { resolveFindDomains } from "@/omnigraph-api/lib/find-domains/find-domains-resolver";
import { resolveFindEvents } from "@/omnigraph-api/lib/find-events/find-events-resolver";
import { resolveAccountNameReferences } from "@/omnigraph-api/lib/find-name-references/find-name-references-resolver";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { buildAccountPrimaryNamesSelection } from "@/omnigraph-api/lib/resolution/account-primary-names-selection";
import { resolvePrimaryNameRecords } from "@/omnigraph-api/lib/resolution/resolve-primary-name-records";
import { AccountIdInput } from "@/omnigraph-api/schema/account-id";
import {
  ID_PAGINATED_CONNECTION_ARGS,
  RESOLVE_ACCELERATE_ARG,
} from "@/omnigraph-api/schema/constants";
import { DomainInterfaceRef } from "@/omnigraph-api/schema/domain";
import {
  AccountDomainsWhereInput,
  DOMAINS_ORDERING_DESCRIPTION,
  DomainsOrderInput,
} from "@/omnigraph-api/schema/domain-inputs";
import { EventRef } from "@/omnigraph-api/schema/event";
import { AccountEventsWhereInput } from "@/omnigraph-api/schema/event-inputs";
import { NameReferenceRef } from "@/omnigraph-api/schema/name-reference";
import { PermissionsUserRef } from "@/omnigraph-api/schema/permissions";
import { RegistryPermissionsUserRef } from "@/omnigraph-api/schema/registry-permissions-user";
import { ResolverPermissionsUserRef } from "@/omnigraph-api/schema/resolver-permissions-user";
import {
  type ReverseResolveModel,
  ReverseResolveRef,
} from "@/omnigraph-api/schema/reverse-resolve";

/**
 * An Account is modeled purely by its {@link NormalizedAddress} — the `account` table holds only an
 * id, so there is nothing to load. Resolving `Query.account` to an address directly (rather than via
 * a dataloader) means resolvable-but-unindexed Accounts (e.g. those with only an off-chain primary
 * name) are supported automatically: Reverse Resolution (`Account.resolve`) is keyed by address and
 * works independent of indexing, while indexed-only relations (`domains`, `events`, `permissions`)
 * naturally return empty for an unindexed address.
 */
export const AccountRef = builder.objectRef<NormalizedAddress>("Account");

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
      resolve: (parent) => parent,
    }),

    ///////////////////
    // Account.address
    ///////////////////
    address: t.field({
      description: "An EVM Address that uniquely identifies this Account on-chain.",
      type: "Address",
      nullable: false,
      resolve: (parent) => parent,
    }),

    //////////////////
    // Account.resolve
    //////////////////
    resolve: t.field({
      description: "Resolve primary names for this Account.",
      type: ReverseResolveRef,
      nullable: false,
      args: {
        accelerate: t.arg.boolean(RESOLVE_ACCELERATE_ARG),
      },
      resolve: async (
        account,
        { accelerate: accelerateArg },
        context,
        info,
      ): Promise<ReverseResolveModel> => {
        const accelerate = accelerateArg ?? true;
        const { canAccelerate } = context;
        const coinTypes = buildAccountPrimaryNamesSelection(info);

        // No primaryName/primaryNames fields selected (e.g. only acceleration/trace queried).
        // Return an empty model rather than throwing so the non-nullable resolve field does not
        // null-propagate the entire Account.
        if (coinTypes === null) {
          return {
            address: account,
            coinTypes: [],
            accelerate,
            canAccelerate,
            trace: [],
            records: [],
          };
        }

        const { trace, records } = await resolvePrimaryNameRecords(account, coinTypes, {
          accelerate,
          canAccelerate,
        });

        return { address: account, coinTypes, accelerate, canAccelerate, trace, records };
      },
    }),

    ////////////////////
    // Account.domains
    ////////////////////
    domains: t.connection({
      description: `The Domains that are owned by the Account. ${DOMAINS_ORDERING_DESCRIPTION}`,
      type: DomainInterfaceRef,
      args: {
        where: t.arg({ type: AccountDomainsWhereInput }),
        order: t.arg({ type: DomainsOrderInput }),
      },
      resolve: (parent, { where, order, ...connectionArgs }) =>
        resolveFindDomains({
          where: { ...where, ownerId: parent },
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
          where: { ...args.where, sender: { eq: parent } },
        }),
    }),

    //////////////////////////
    // Account.nameReferences
    //////////////////////////
    nameReferences: t.connection({
      description:
        "The Names whose indexed `addr()` record points at this Account, optionally scoped to a single CoinType. Reflects literally-indexed, Canonical Domains only: records whose node has no Canonical Domain are omitted.",
      type: NameReferenceRef,
      args: {
        where: t.arg({ type: AccountNameReferencesWhereInput }),
      },
      resolve: (parent, { where, ...connectionArgs }) =>
        resolveAccountNameReferences({
          account: parent,
          coinType: where?.coinType,
          ...connectionArgs,
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
        const { ensDb, ensIndexerSchema } = di.context;
        const scope = and(
          // this user's permissions
          eq(ensIndexerSchema.permissionsUser.user, parent),
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
        const { ensDb, ensIndexerSchema } = di.context;
        const scope = eq(ensIndexerSchema.permissionsUser.user, parent);
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
        const { ensDb, ensIndexerSchema } = di.context;
        const scope = eq(ensIndexerSchema.permissionsUser.user, parent);
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

export const AccountNameReferencesWhereInput = builder.inputType(
  "AccountNameReferencesWhereInput",
  {
    description: "Filter for Account.nameReferences.",
    fields: (t) => ({
      coinType: t.field({
        type: "CoinType",
        description:
          "If set, scopes matches to a single CoinType. When omitted, returns matches across all CoinTypes.",
      }),
    }),
  },
);

export const AccountPermissionsWhereInput = builder.inputType("AccountPermissionsWhereInput", {
  description: "Filter for Account.permissions.",
  fields: (t) => ({
    contract: t.field({
      type: AccountIdInput,
      description: "If set, filters this Account's Permissions to those granted in this contract.",
    }),
  }),
});
