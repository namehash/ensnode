import { trace } from "@opentelemetry/api";
import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, count, eq, getTableColumns } from "drizzle-orm";
import type { DomainId } from "enssdk";

import type { RequiredAndNotNull, RequiredAndNull } from "@ensnode/ensnode-sdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { withSpanAsync } from "@/lib/instrumentation/auto-span";
import { builder } from "@/omnigraph-api/builder";
import {
  orderPaginationBy,
  paginateBy,
  paginateByInt,
} from "@/omnigraph-api/lib/connection-helpers";
import { cursors } from "@/omnigraph-api/lib/cursors";
import { resolveFindDomains } from "@/omnigraph-api/lib/find-domains/find-domains-resolver";
import {
  domainsBase,
  filterByName,
  filterByParent,
  withOrderingMetadata,
} from "@/omnigraph-api/lib/find-domains/layers";
import { resolveFindEvents } from "@/omnigraph-api/lib/find-events/find-events-resolver";
import { getDomainResolver } from "@/omnigraph-api/lib/get-domain-resolver";
import { getLatestRegistration } from "@/omnigraph-api/lib/get-latest-registration";
import { getModelId } from "@/omnigraph-api/lib/get-model-id";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { AccountRef } from "@/omnigraph-api/schema/account";
import {
  ID_PAGINATED_CONNECTION_ARGS,
  PAGINATION_DEFAULT_MAX_SIZE,
  PAGINATION_DEFAULT_PAGE_SIZE,
} from "@/omnigraph-api/schema/constants";
import { ENSProtocolVersion } from "@/omnigraph-api/schema/ens-protocol-version";
import { EventRef, EventsWhereInput } from "@/omnigraph-api/schema/event";
import { LabelRef } from "@/omnigraph-api/schema/label";
import { OrderDirection } from "@/omnigraph-api/schema/order-direction";
import { PermissionsUserRef } from "@/omnigraph-api/schema/permissions";
import { RegistrationInterfaceRef } from "@/omnigraph-api/schema/registration";
import { RegistryInterfaceRef } from "@/omnigraph-api/schema/registry";
import { ResolverRef } from "@/omnigraph-api/schema/resolver";

const tracer = trace.getTracer("schema/Domain");

///////////////////////////////
// Loadable Interface (Domain)
///////////////////////////////

export const DomainInterfaceRef = builder.loadableInterfaceRef("Domain", {
  load: (ids: DomainId[]) =>
    withSpanAsync(tracer, "Domain.load", { count: ids.length }, () =>
      ensDb.query.domain.findMany({
        where: (t, { inArray }) => inArray(t.id, ids),
        with: { label: true },
      }),
    ),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type Domain = Exclude<typeof DomainInterfaceRef.$inferType, DomainId>;
export type DomainInterface = Omit<Domain, "tokenId" | "node" | "rootRegistryOwnerId">;
export type ENSv1Domain = RequiredAndNotNull<Domain, "node"> &
  RequiredAndNull<Domain, "tokenId"> & { type: "ENSv1Domain" };
export type ENSv2Domain = RequiredAndNotNull<Domain, "tokenId"> &
  RequiredAndNull<Domain, "node" | "rootRegistryOwnerId"> & { type: "ENSv2Domain" };

export const isENSv1Domain = (domain: DomainInterface): domain is ENSv1Domain =>
  domain.type === "ENSv1Domain";

export const isENSv2Domain = (domain: DomainInterface): domain is ENSv2Domain =>
  domain.type === "ENSv2Domain";

export const ENSv1DomainRef = builder.objectRef<ENSv1Domain>("ENSv1Domain");
export const ENSv2DomainRef = builder.objectRef<ENSv2Domain>("ENSv2Domain");

////////////////////////////////
// DomainCanonical
////////////////////////////////
export const DomainCanonicalRef = builder.objectRef<Domain>("DomainCanonical");

DomainCanonicalRef.implement({
  description:
    "The materialized canonical-tree projection of a Canonical Domain — Canonical Name, " +
    "leaf-to-root canonical path (as DomainIds), and namehash.",
  fields: (t) => ({
    name: t.field({
      description: "The Canonical Name for this Domain.",
      type: "InterpretedName",
      nullable: false,
      resolve: (domain) => {
        if (!domain.canonicalName) {
          throw new Error(
            `Invariant(DomainCanonical.name): canonical Domain '${domain.id}' is missing canonicalName.`,
          );
        }
        return domain.canonicalName;
      },
    }),
    path: t.field({
      description:
        "The Canonical Path from this Domain to the ENS Root, leaf→root inclusive of this Domain. Returned as DomainIds.",
      type: [DomainInterfaceRef],
      nullable: false,
      resolve: async (domain, _args, context) => {
        const canonicalPath = await context.loaders.canonicalPath.load(domain.id);
        if (canonicalPath instanceof Error) throw canonicalPath;
        if (canonicalPath === null) {
          throw new Error(
            `Invariant(DomainCanonical.path): canonical Domain '${domain.id}' produced null canonical path.`,
          );
        }
        return canonicalPath;
      },
    }),
    node: t.field({
      description: "The namehash of this Domain's Canonical Name.",
      type: "Node",
      nullable: false,
      resolve: (domain) => {
        if (!domain.canonicalNode) {
          throw new Error(
            `Invariant(DomainCanonical.node): canonical Domain '${domain.id}' is missing canonicalNode.`,
          );
        }
        return domain.canonicalNode;
      },
    }),
  }),
});

//////////////////////////////////
// DomainInterface Implementation
//////////////////////////////////
DomainInterfaceRef.implement({
  description:
    "A Domain represents an individual Label within the ENS namegraph. It may or may not be Canonical. It may be an ENSv1Domain or an ENSv2Domain.",
  fields: (t) => ({
    /////////////
    // Domain.id
    /////////////
    id: t.field({
      description: "A unique reference to this Domain.",
      type: "DomainId",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ////////////////
    // Domain.label
    ////////////////
    label: t.field({
      type: LabelRef,
      description: "The Label this Domain represents in the ENS Namegraph",
      nullable: false,
      resolve: (parent) => parent.label,
    }),

    ////////////////////
    // Domain.canonical
    ////////////////////
    canonical: t.field({
      description:
        "The materialized canonical-tree projection of this Domain (Canonical Name, leaf-to-root canonical path, and namehash). Null when the Domain is not Canonical.",
      type: DomainCanonicalRef,
      nullable: true,
      resolve: (domain) => (domain.canonical ? domain : null),
    }),

    /////////////////
    // Domain.parent
    /////////////////
    parent: t.field({
      description:
        "The direct parent Domain via a single unidirectional walk up the namegraph (`Domain.registryId` → `Registry.canonicalDomainId`). No edge-authentication check; available for canonical and non-canonical Domains alike. Null when the parent Registry has no canonical Domain set (e.g., a root Registry).",
      type: DomainInterfaceRef,
      nullable: true,
      resolve: async (domain) => {
        const registry = await ensDb.query.registry.findFirst({
          where: (t, { eq }) => eq(t.id, domain.registryId),
          columns: { canonicalDomainId: true },
        });
        return registry?.canonicalDomainId ?? null;
      },
    }),

    ////////////////
    // Domain.owner
    ////////////////
    owner: t.field({
      type: AccountRef,
      description:
        "If this is an ENSv1Domain, this is the effective owner of the Domain. If this is an ENSv2Domain, this is the on-chain owner address (the HCA account address if used).",
      nullable: true,
      resolve: (parent) => parent.ownerId,
    }),

    ///////////////////
    // Domain.resolver
    ///////////////////
    resolver: t.field({
      description:
        "The Resolver that this Domain has assigned, if any. NOTE that this is the Domain's _assigned_ Resolver, _not_ its _effective_ Resolver, which can only be determined by following ENS Forward Resolution and ENSIP-10.",
      type: ResolverRef,
      nullable: true,
      resolve: (parent) => getDomainResolver(parent.id),
    }),

    ///////////////////////
    // Domain.registration
    ///////////////////////
    registration: t.field({
      description: "The latest Registration for this Domain, if exists.",
      type: RegistrationInterfaceRef,
      nullable: true,
      resolve: (parent) => getLatestRegistration(parent.id),
    }),

    ////////////////////////
    // Domain.registrations
    ////////////////////////
    registrations: t.connection({
      description: "All Registrations for a Domain, including the latest Registration.",
      type: RegistrationInterfaceRef,
      resolve: (parent, args) => {
        const scope = eq(ensIndexerSchema.registration.domainId, parent.id);

        return lazyConnection({
          totalCount: () => ensDb.$count(ensIndexerSchema.registration, scope),
          connection: () =>
            resolveCursorConnection(
              {
                toCursor: (model) => cursors.encode(String(model.registrationIndex)),
                defaultSize: PAGINATION_DEFAULT_PAGE_SIZE,
                maxSize: PAGINATION_DEFAULT_MAX_SIZE,
                args,
              },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                ensDb
                  .select()
                  .from(ensIndexerSchema.registration)
                  .where(
                    and(
                      scope,
                      paginateByInt(ensIndexerSchema.registration.registrationIndex, before, after),
                    ),
                  )
                  .orderBy(
                    orderPaginationBy(ensIndexerSchema.registration.registrationIndex, inverted),
                  )
                  .limit(limit),
            ),
        });
      },
    }),

    /////////////////////
    // Domain.subdomains
    /////////////////////
    subdomains: t.connection({
      description: "All Domains that are direct descendents of this Domain in the namegraph.",
      type: DomainInterfaceRef,
      args: {
        where: t.arg({ type: SubdomainsWhereInput }),
        order: t.arg({ type: DomainsOrderInput }),
      },
      resolve: (parent, { where, order, ...connectionArgs }, context) => {
        const base = filterByParent(domainsBase(), parent.id);
        const named = filterByName(base, where?.name);
        const domains = withOrderingMetadata(named);

        return resolveFindDomains(context, { domains, order, ...connectionArgs });
      },
    }),

    //////////////////
    // Domain.events
    //////////////////
    events: t.connection({
      description: "All Events associated with this Domain.",
      type: EventRef,
      args: {
        where: t.arg({ type: EventsWhereInput }),
      },
      resolve: (parent, args) =>
        resolveFindEvents(args, {
          through: {
            table: ensIndexerSchema.domainEvent,
            scope: eq(ensIndexerSchema.domainEvent.domainId, parent.id),
          },
        }),
    }),
  }),
});

//////////////////////////////
// ENSv1Domain Implementation
//////////////////////////////
ENSv1DomainRef.implement({
  description: "An ENSv1Domain represents an ENSv1 Domain.",
  interfaces: [DomainInterfaceRef],
  isTypeOf: (domain) => isENSv1Domain(domain as DomainInterface),
  fields: (t) => ({
    ///////////////////
    // ENSv1Domain.node
    ///////////////////
    node: t.field({
      description: "The namehash of this ENSv1 Domain.",
      type: "Node",
      nullable: false,
      resolve: (parent) => parent.node,
    }),

    /////////////////////////////////
    // ENSv1Domain.rootRegistryOwner
    /////////////////////////////////
    rootRegistryOwner: t.field({
      description:
        "The rootRegistryOwner of this Domain, i.e. the owner() of this Domain within the ENSv1 Registry.",
      type: AccountRef,
      nullable: true,
      resolve: (parent) => parent.rootRegistryOwnerId,
    }),
  }),
});

//////////////////////////////
// ENSv2Domain Implementation
//////////////////////////////
ENSv2DomainRef.implement({
  description: "An ENSv2Domain represents an ENSv2 Domain.",
  interfaces: [DomainInterfaceRef],
  isTypeOf: (domain) => isENSv2Domain(domain as DomainInterface),
  fields: (t) => ({
    //////////////////////
    // ENSv2Domain.tokenId
    //////////////////////
    tokenId: t.field({
      description: "The ENSv2Domain's current Token Id.",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.tokenId,
    }),

    ///////////////////////
    // ENSv2Domain.registry
    ///////////////////////
    registry: t.field({
      description: "The Registry under which this ENSv2Domain exists.",
      type: RegistryInterfaceRef,
      nullable: false,
      resolve: (parent) => parent.registryId,
    }),

    //////////////////////////
    // ENSv2Domain.subregistry
    //////////////////////////
    subregistry: t.field({
      type: RegistryInterfaceRef,
      description: "The Registry this ENSv2Domain declares as its Subregistry, if exists.",
      nullable: true,
      resolve: (parent) => parent.subregistryId,
    }),

    ///////////////////////////
    // ENSv2Domain.permissions
    ///////////////////////////
    permissions: t.connection({
      description:
        "Permissions for this Domain within its Registry, representing the roles granted to users for this Domain's token.",
      type: PermissionsUserRef,
      args: {
        where: t.arg({ type: DomainPermissionsWhereInput }),
      },
      resolve: (parent, args) => {
        const scope = and(
          // filter by resource === tokenId
          eq(ensIndexerSchema.permissionsUser.resource, parent.tokenId),
          // optionally filter by user
          args.where?.user ? eq(ensIndexerSchema.permissionsUser.user, args.where.user) : undefined,
        );

        // inner join against this Domain's registry to filter Permissions by those in said registry
        const join = and(
          eq(ensIndexerSchema.permissionsUser.chainId, ensIndexerSchema.registry.chainId),
          eq(ensIndexerSchema.permissionsUser.address, ensIndexerSchema.registry.address),
          eq(ensIndexerSchema.registry.id, parent.registryId),
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
  }),
});

//////////////////////
// Inputs
//////////////////////

export const DomainPermissionsWhereInput = builder.inputType("DomainPermissionsWhereInput", {
  description: "Filter Permissions over this Domain by a specific User address.",
  fields: (t) => ({
    user: t.field({ type: "Address" }),
  }),
});

export const DomainIdInput = builder.inputType("DomainIdInput", {
  description: "Reference a specific Domain.",
  isOneOf: true,
  fields: (t) => ({
    name: t.field({ type: "InterpretedName" }),
    id: t.field({ type: "DomainId" }),
  }),
});

export const DomainsWhereInput = builder.inputType("DomainsWhereInput", {
  description: "Filter for the top-level domains query.",
  fields: (t) => ({
    name: t.string({
      required: true,
      description:
        "A partial Interpreted Name by which to search the set of Domains. ex: 'example', 'example.', 'example.et'.",
    }),
    version: t.field({
      type: ENSProtocolVersion,
      description:
        "If set, filters the set of Domains to only those of the specified ENS protocol version.",
    }),
  }),
});

export const AccountDomainsWhereInput = builder.inputType("AccountDomainsWhereInput", {
  description: "Filter for Account.domains query.",
  fields: (t) => ({
    name: t.string({
      description:
        "A partial Interpreted Name by which to search the set of Domains. ex: 'example', 'example.', 'example.et'.",
    }),
    canonical: t.boolean({
      description:
        "Optional, defaults to false. If true, filters the set of Domains by those that are Canonical (i.e. reachable by ENS Forward Resolution).",
      defaultValue: false,
    }),
    version: t.field({
      type: ENSProtocolVersion,
      description:
        "If set, filters the set of Domains to only those of the specified ENS protocol version.",
    }),
  }),
});

export const RegistryDomainsWhereInput = builder.inputType("RegistryDomainsWhereInput", {
  description: "Filter for Registry.domains query.",
  fields: (t) => ({
    name: t.string({
      description: "A partial Interpreted Name by which to filter Domains in this Registry.",
    }),
  }),
});

export const SubdomainsWhereInput = builder.inputType("SubdomainsWhereInput", {
  description: "Filter for Domain.subdomains query.",
  fields: (t) => ({
    name: t.string({
      description: "A partial Interpreted Name by which to filter subdomains.",
    }),
  }),
});

//////////////////////
// Ordering
//////////////////////

export const DomainsOrderBy = builder.enumType("DomainsOrderBy", {
  description: "Fields by which domains can be ordered",
  values: ["NAME", "REGISTRATION_TIMESTAMP", "REGISTRATION_EXPIRY"] as const,
});

export type DomainsOrderByValue = typeof DomainsOrderBy.$inferType;

export const DomainsOrderInput = builder.inputType("DomainsOrderInput", {
  description: "Ordering options for domains query. If no order is provided, the default is ASC.",
  fields: (t) => ({
    by: t.field({ type: DomainsOrderBy, required: true }),
    dir: t.field({ type: OrderDirection, defaultValue: "ASC" }),
  }),
});

export const DOMAINS_DEFAULT_ORDER_BY: typeof DomainsOrderBy.$inferType = "NAME";
export const DOMAINS_DEFAULT_ORDER_DIR: typeof OrderDirection.$inferType = "ASC";
