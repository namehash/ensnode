import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, count, eq, getTableColumns } from "drizzle-orm";

import {
  type DomainId,
  type ENSv1DomainId,
  type ENSv2DomainId,
  getCanonicalId,
  interpretedLabelsToInterpretedName,
} from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { orderPaginationBy, paginateBy, paginateByInt } from "@/graphql-api/lib/connection-helpers";
import { resolveFindDomains } from "@/graphql-api/lib/find-domains/find-domains-resolver";
import {
  domainsBase,
  filterByName,
  filterByParent,
  withOrderingMetadata,
} from "@/graphql-api/lib/find-domains/layers";
import { resolveFindEvents } from "@/graphql-api/lib/find-events/find-events-resolver";
import { getDomainResolver } from "@/graphql-api/lib/get-domain-resolver";
import { getLatestRegistration } from "@/graphql-api/lib/get-latest-registration";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { lazyConnection } from "@/graphql-api/lib/lazy-connection";
import { rejectAnyErrors } from "@/graphql-api/lib/reject-any-errors";
import { AccountRef } from "@/graphql-api/schema/account";
import {
  ID_PAGINATED_CONNECTION_ARGS,
  INDEX_PAGINATED_CONNECTION_ARGS,
} from "@/graphql-api/schema/constants";
import { EventRef, EventsWhereInput } from "@/graphql-api/schema/event";
import { LabelRef } from "@/graphql-api/schema/label";
import { OrderDirection } from "@/graphql-api/schema/order-direction";
import { PermissionsUserRef } from "@/graphql-api/schema/permissions";
import { RegistrationInterfaceRef } from "@/graphql-api/schema/registration";
import { RegistryRef } from "@/graphql-api/schema/registry";
import { ResolverRef } from "@/graphql-api/schema/resolver";
import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";

const isENSv1Domain = (domain: Domain): domain is ENSv1Domain => "parentId" in domain;

/////////////////////////////
// ENSv1Domain & ENSv2Domain
/////////////////////////////

export const ENSv1DomainRef = builder.loadableObjectRef("ENSv1Domain", {
  load: (ids: ENSv1DomainId[]) =>
    ensDb.query.v1Domain.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
      with: { label: true },
    }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export const ENSv2DomainRef = builder.loadableObjectRef("ENSv2Domain", {
  load: (ids: ENSv2DomainId[]) =>
    ensDb.query.v2Domain.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
      with: { label: true },
    }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export const DomainInterfaceRef = builder.loadableInterfaceRef("Domain", {
  load: async (ids: DomainId[]): Promise<(ENSv1Domain | ENSv2Domain)[]> => {
    const [v1Domains, v2Domains] = await Promise.all([
      ensDb.query.v1Domain.findMany({
        where: (t, { inArray }) => inArray(t.id, ids as any), // ignore downcast to ENSv1DomainId
        with: { label: true },
      }),
      ensDb.query.v2Domain.findMany({
        where: (t, { inArray }) => inArray(t.id, ids as any), // ignore downcast to ENSv2DomainId
        with: { label: true },
      }),
    ]);

    return [...v1Domains, ...v2Domains];
  },
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type ENSv1Domain = Exclude<typeof ENSv1DomainRef.$inferType, ENSv1DomainId>;
export type ENSv2Domain = Exclude<typeof ENSv2DomainRef.$inferType, ENSv2DomainId>;
export type Domain = Exclude<typeof DomainInterfaceRef.$inferType, DomainId>;

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

    ///////////////
    // Domain.name
    ///////////////
    name: t.field({
      description:
        "The Canonical Name for this Domain. If the Domain is not Canonical, then `name` will be null.",
      type: "Name",
      nullable: true,
      resolve: async (domain, args, context) => {
        const canonicalPath = isENSv1Domain(domain)
          ? await context.loaders.v1CanonicalPath.load(domain.id)
          : await context.loaders.v2CanonicalPath.load(domain.id);
        if (!canonicalPath) return null;

        // TODO: this could be more efficient if the get*CanonicalPath helpers included the label
        // join for us.
        const domains = await rejectAnyErrors(
          DomainInterfaceRef.getDataloader(context).loadMany(canonicalPath),
        );

        const labels = canonicalPath.map((domainId) => {
          const found = domains.find((d) => d.id === domainId);
          if (!found) {
            throw new Error(
              `Invariant(Domain.name): Domain in CanonicalPath not found:\nPath: ${JSON.stringify(canonicalPath)}\nDomainId: ${domainId}`,
            );
          }

          return found.label.interpreted;
        });

        return interpretedLabelsToInterpretedName(labels);
      },
    }),

    ///////////////
    // Domain.path
    ///////////////
    path: t.field({
      description:
        "The Canonical Path from the ENS Root to this Domain. `path` is null if the Domain is not Canonical.",
      type: [DomainInterfaceRef],
      nullable: true,
      resolve: async (domain, args, context) => {
        const canonicalPath = isENSv1Domain(domain)
          ? await context.loaders.v1CanonicalPath.load(domain.id)
          : await context.loaders.v2CanonicalPath.load(domain.id);
        if (!canonicalPath) return null;

        return await rejectAnyErrors(
          DomainInterfaceRef.getDataloader(context).loadMany(canonicalPath),
        );
      },
    }),

    ////////////////
    // Domain.owner
    ////////////////
    owner: t.field({
      type: AccountRef,
      description: "The owner of this Domain.",
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
              { ...INDEX_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                ensDb
                  .select()
                  .from(ensIndexerSchema.registration)
                  .where(
                    and(scope, paginateByInt(ensIndexerSchema.registration.index, before, after)),
                  )
                  .orderBy(orderPaginationBy(ensIndexerSchema.registration.index, inverted))
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
  isTypeOf: (domain) => isENSv1Domain(domain as Domain),
  fields: (t) => ({
    //////////////////////
    // ENSv1Domain.parent
    //////////////////////
    parent: t.field({
      description: "The parent Domain of this Domain in the ENSv1 nametree.",
      type: ENSv1DomainRef,
      nullable: true,
      resolve: (parent) => parent.parentId,
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
  isTypeOf: (domain) => !isENSv1Domain(domain as Domain),
  fields: (t) => ({
    //////////////////////
    // Domain.canonicalId
    //////////////////////
    canonicalId: t.field({
      description: "The ENSv2Domain's Canonical Id.",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => getCanonicalId(parent.tokenId),
    }),

    //////////////////////
    // Domain.tokenId
    //////////////////////
    tokenId: t.field({
      description: "The ENSv2Domain's current Token Id.",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.tokenId,
    }),

    //////////////////////
    // Domain.registry
    //////////////////////
    registry: t.field({
      description: "The Registry under which this ENSv2Domain exists.",
      type: RegistryRef,
      nullable: false,
      resolve: (parent) => parent.registryId,
    }),

    //////////////////////
    // Domain.subregistry
    //////////////////////
    subregistry: t.field({
      type: RegistryRef,
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
    name: t.field({ type: "Name" }),
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
    canonical: t.boolean({
      description:
        "Optional, defaults to false. If true, filters the set of Domains by those that are Canonical (i.e. reachable by ENS Forward Resolution). If false, the set of Domains is not filtered, and may include ENSv2 Domains not reachable by ENS Forward Resolution.",
      defaultValue: false,
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
