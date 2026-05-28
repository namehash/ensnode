import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, count, eq, getTableColumns } from "drizzle-orm";
import type { Address, JsonValue } from "enssdk";

import type { TracingTrace } from "@ensnode/ensnode-sdk";

import di from "@/di";
import { builder } from "@/omnigraph-api/builder";
import { orderPaginationBy, paginateBy } from "@/omnigraph-api/lib/connection-helpers";
import { resolveFindDomains } from "@/omnigraph-api/lib/find-domains/find-domains-resolver";
import { resolveFindEvents } from "@/omnigraph-api/lib/find-events/find-events-resolver";
import { getModelId } from "@/omnigraph-api/lib/get-model-id";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { buildAccountPrimaryNamesSelection } from "@/omnigraph-api/lib/resolution/account-primary-names-selection";
import {
  normalizeAccountPrimaryNamesWhereInput,
  normalizePrimaryNameByInput,
} from "@/omnigraph-api/lib/resolution/primary-name-input";
import { resolvePrimaryNameRecords } from "@/omnigraph-api/lib/resolution/resolve-primary-name-records";
import { AccountIdInput } from "@/omnigraph-api/schema/account-id";
import {
  ID_PAGINATED_CONNECTION_ARGS,
  RESOLVE_ACCELERATE_ARG,
} from "@/omnigraph-api/schema/constants";
import { DomainInterfaceRef } from "@/omnigraph-api/schema/domain";
import { AccountDomainsWhereInput, DomainsOrderInput } from "@/omnigraph-api/schema/domain-inputs";
import { EventRef } from "@/omnigraph-api/schema/event";
import { AccountEventsWhereInput } from "@/omnigraph-api/schema/event-inputs";
import { PermissionsUserRef } from "@/omnigraph-api/schema/permissions";
import { RegistryPermissionsUserRef } from "@/omnigraph-api/schema/registry-permissions-user";
import {
  AccelerationStatusRef,
  AccountPrimaryNamesWhereInput,
  PrimaryNameByInput,
  type PrimaryNameRecordModel,
  PrimaryNameRecordRef,
} from "@/omnigraph-api/schema/resolution";
import { ResolverPermissionsUserRef } from "@/omnigraph-api/schema/resolver-permissions-user";

export const AccountRef = builder.loadableObjectRef("Account", {
  load: (ids: Address[]) => {
    const { ensDb } = di.context;
    return ensDb.query.account.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
    });
  },
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type Account = Exclude<typeof AccountRef.$inferType, Address>;
type AccountPrimaryNamesResult = {
  trace: TracingTrace | null;
  records: PrimaryNameRecordModel[];
};
type AccountResolveModel = {
  account: Account;
  accelerate: boolean;
  canAccelerate: boolean;
  primaryNamesResolution: Promise<AccountPrimaryNamesResult> | null;
};
const AccountResolveRef = builder.objectRef<AccountResolveModel>("AccountResolve");

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

    //////////////////
    // Account.resolve
    //////////////////
    resolve: t.field({
      description: "Resolve primary names for this Account with protocol acceleration controls.",
      type: AccountResolveRef,
      nullable: false,
      args: {
        accelerate: t.arg.boolean(RESOLVE_ACCELERATE_ARG),
      },
      resolve: (account, { accelerate: accelerateArg }, context, info) => {
        const accelerate = accelerateArg ?? true;
        const { canAccelerate } = context;
        const coinTypes = buildAccountPrimaryNamesSelection(info);

        const primaryNamesResolution =
          coinTypes !== null
            ? resolvePrimaryNameRecords(account.id, coinTypes, { accelerate, canAccelerate })
            : null;

        return { account, accelerate, canAccelerate, primaryNamesResolution };
      },
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
        const { ensDb, ensIndexerSchema } = di.context;
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
        const { ensDb, ensIndexerSchema } = di.context;
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
        const { ensDb, ensIndexerSchema } = di.context;
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

AccountResolveRef.implement({
  description:
    "Nested account resolution container exposing primary-name resolution with shared acceleration settings.",
  fields: (t) => ({
    trace: t.field({
      description:
        "Protocol trace tree emitted by primary-name resolution, represented as JSON for schema stability.",
      type: "JSON",
      nullable: true,
      resolve: async ({ primaryNamesResolution }) => {
        if (!primaryNamesResolution) return null;
        const { trace } = await primaryNamesResolution;
        return trace as unknown as JsonValue | null;
      },
    }),
    acceleration: t.field({
      description: "Protocol acceleration strategy status for this Account resolution.",
      type: AccelerationStatusRef,
      nullable: false,
      resolve: ({ accelerate, canAccelerate }) => ({
        requested: accelerate,
        attempted: accelerate && canAccelerate,
      }),
    }),
    primaryName: t.field({
      description: "The ENSIP-19 primary name for this Account on a specific coin type or chain.",
      type: PrimaryNameRecordRef,
      nullable: false,
      args: {
        by: t.arg({
          type: PrimaryNameByInput,
          required: true,
          description: "Select a coin type or chain to resolve a primary name for.",
        }),
      },
      resolve: async ({ primaryNamesResolution, accelerate }, { by }) => {
        if (!primaryNamesResolution) {
          throw new Error("primaryName requires a primary-name resolution to be started.");
        }
        const coinType = normalizePrimaryNameByInput(by);
        const { records } = await primaryNamesResolution;
        const record = records.find((r) => r.coinType === coinType);
        if (!record) {
          throw new Error(`Missing primary name record for requested coin type: ${coinType}`);
        }
        return { ...record, accelerate };
      },
    }),
    primaryNames: t.field({
      description: "ENSIP-19 primary names for this Account on the requested coin types or chains.",
      type: [PrimaryNameRecordRef],
      nullable: false,
      args: {
        where: t.arg({
          type: AccountPrimaryNamesWhereInput,
          required: true,
          description: "Select coin types or chains to resolve primary names for.",
        }),
      },
      resolve: async ({ primaryNamesResolution, accelerate }, { where }) => {
        if (!primaryNamesResolution) {
          throw new Error("primaryNames requires a primary-name resolution to be started.");
        }
        const coinTypes = normalizeAccountPrimaryNamesWhereInput(where);
        const { records } = await primaryNamesResolution;

        // return records in the order of requested coinTypes
        return coinTypes.map((coinType) => {
          const record = records.find((r) => r.coinType === coinType);
          if (!record) {
            throw new Error(`Missing primary name record for requested coin type: ${coinType}`);
          }
          return { ...record, accelerate };
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
