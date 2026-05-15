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
import { applyDomainsNameFilter } from "@/omnigraph-api/lib/find-domains/apply-name-filter";
import { resolveFindDomains } from "@/omnigraph-api/lib/find-domains/find-domains-resolver";
import {
  domainsBase,
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
import { DomainCanonicalRef } from "@/omnigraph-api/schema/domain-canonical";
import {
  DomainPermissionsWhereInput,
  DomainsOrderInput,
  SubdomainsWhereInput,
} from "@/omnigraph-api/schema/domain-inputs";
import { EventRef, EventsWhereInput } from "@/omnigraph-api/schema/event";
import { LabelRef } from "@/omnigraph-api/schema/label";
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

//////////////////////////////////
// DomainInterface Implementation
//////////////////////////////////
DomainInterfaceRef.implement({
  description:
    "Represents a Domain, i.e. an individual Label within the ENS namegraph. It may or may not be Canonical. It may be an ENSv1Domain or an ENSv2Domain.",
  fields: (t) => ({
    /////////////
    // Domain.id
    /////////////
    id: t.field({
      description: "A unique and stable reference to this Domain.",
      type: "DomainId",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ////////////////
    // Domain.label
    ////////////////
    label: t.field({
      type: LabelRef,
      description: "The Label associated with this Domain in the ENS Namegraph.",
      nullable: false,
      resolve: (parent) => parent.label,
    }),

    ////////////////////
    // Domain.canonical
    ////////////////////
    canonical: t.field({
      description:
        "Metadata (name, path, and node) related to the Domain's canonicality, if known. Null when the Domain is not in the canonical nametree.",
      type: DomainCanonicalRef,
      nullable: true,
      resolve: (domain) => (domain.canonical ? domain : null),
    }),

    /////////////////
    // Domain.parent
    /////////////////
    parent: t.field({
      description:
        "The Domain that this Domain's parent Registry declares as its Canonical Domain, if any. Follows a single unidirectional pointer (`Registry.canonicalDomainId`) and does NOT enforce bidirectional canonical-edge agreement: a non-canonical Domain may have a non-null `parent`, and a canonical Domain's `parent` may itself be non-canonical. Null when the parent Registry does not declare a Canonical Domain.",
      type: DomainInterfaceRef,
      nullable: true,
      resolve: async (domain, _args, context) =>
        context.loaders.registryParentDomain.load(domain.registryId),
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
    // Domain.registry
    ///////////////////
    registry: t.field({
      description: "The Registry under which this Domain exists.",
      type: RegistryInterfaceRef,
      nullable: false,
      resolve: (parent) => parent.registryId,
    }),

    //////////////////////
    // Domain.subregistry
    //////////////////////
    subregistry: t.field({
      type: RegistryInterfaceRef,
      description: "The Registry this Domain declares as its Subregistry, if exists.",
      nullable: true,
      resolve: (parent) => parent.subregistryId,
    }),

    ///////////////////////////
    // Domain.assignedResolver
    ///////////////////////////
    assignedResolver: t.field({
      description:
        "The Resolver that this Domain has assigned, if any. NOTE that this is the Domain's _assigned_ Resolver, _not_ its _effective_ Resolver, which can only be determined by following ENS Forward Resolution and ENSIP-10. Do NOT use this Domain-Resolver relationship in isolation to resolve records, that operation is NOT ENS Forward Resolution.",
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
        const { base: named, defaultOrderBy } = applyDomainsNameFilter(base, where?.name);
        const domains = withOrderingMetadata(named);

        return resolveFindDomains(context, { domains, order, defaultOrderBy, ...connectionArgs });
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
