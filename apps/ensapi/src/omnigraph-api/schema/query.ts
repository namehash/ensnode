import config from "@/config";

import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { makeConcreteRegistryId, makePermissionsId, makeResolverId } from "enssdk";

import { getRootRegistryId } from "@ensnode/ensnode-sdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { builder } from "@/omnigraph-api/builder";
import { orderPaginationBy, paginateBy } from "@/omnigraph-api/lib/connection-helpers";
import { resolveFindDomains } from "@/omnigraph-api/lib/find-domains/find-domains-resolver";
import {
  domainsBase,
  filterByCanonical,
  filterByName,
  withOrderingMetadata,
} from "@/omnigraph-api/lib/find-domains/layers";
import { getDomainIdByInterpretedName } from "@/omnigraph-api/lib/get-domain-by-interpreted-name";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { AccountByInput, AccountRef } from "@/omnigraph-api/schema/account";
import { ID_PAGINATED_CONNECTION_ARGS } from "@/omnigraph-api/schema/constants";
import {
  DomainIdInput,
  DomainInterfaceRef,
  DomainsOrderInput,
  DomainsWhereInput,
} from "@/omnigraph-api/schema/domain";
import { PermissionsIdInput, PermissionsRef } from "@/omnigraph-api/schema/permissions";
import { RegistrationInterfaceRef } from "@/omnigraph-api/schema/registration";
import { RegistryIdInput, RegistryInterfaceRef } from "@/omnigraph-api/schema/registry";
import { ResolverIdInput, ResolverRef } from "@/omnigraph-api/schema/resolver";

// don't want them to get familiar/accustomed to these methods until their necessity is certain
const INCLUDE_DEV_METHODS = process.env.NODE_ENV !== "production";

builder.queryType({
  fields: (t) => ({
    ...(INCLUDE_DEV_METHODS && {
      //////////////////////////////
      // Query.allDomains (Testing)
      //////////////////////////////
      allDomains: t.connection({
        description: "TODO",
        type: DomainInterfaceRef,
        resolve: (parent, args) =>
          lazyConnection({
            totalCount: () => ensDb.$count(ensIndexerSchema.domain),
            connection: () =>
              resolveCursorConnection(
                { ...ID_PAGINATED_CONNECTION_ARGS, args },
                ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                  ensDb.query.domain.findMany({
                    where: () => paginateBy(ensIndexerSchema.domain.id, before, after),
                    orderBy: orderPaginationBy(ensIndexerSchema.domain.id, inverted),
                    limit,
                    with: { label: true },
                  }),
              ),
          }),
      }),

      /////////////////////////////
      // Query.resolvers (Testing)
      /////////////////////////////
      resolvers: t.connection({
        description: "TODO",
        type: ResolverRef,
        resolve: (parent, args) =>
          lazyConnection({
            totalCount: () => ensDb.$count(ensIndexerSchema.resolver),
            connection: () =>
              resolveCursorConnection(
                { ...ID_PAGINATED_CONNECTION_ARGS, args },
                ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                  ensDb
                    .select()
                    .from(ensIndexerSchema.resolver)
                    .where(paginateBy(ensIndexerSchema.resolver.id, before, after))
                    .orderBy(orderPaginationBy(ensIndexerSchema.resolver.id, inverted))
                    .limit(limit),
              ),
          }),
      }),

      /////////////////////////////////
      // Query.registrations (Testing)
      /////////////////////////////////
      registrations: t.connection({
        description: "TODO",
        type: RegistrationInterfaceRef,
        resolve: (parent, args) =>
          lazyConnection({
            totalCount: () => ensDb.$count(ensIndexerSchema.registration),
            connection: () =>
              resolveCursorConnection(
                { ...ID_PAGINATED_CONNECTION_ARGS, args },
                ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                  ensDb
                    .select()
                    .from(ensIndexerSchema.registration)
                    .where(paginateBy(ensIndexerSchema.registration.id, before, after))
                    .orderBy(orderPaginationBy(ensIndexerSchema.registration.id, inverted))
                    .limit(limit),
              ),
          }),
      }),
    }),

    ////////////////
    // Find Domains
    ////////////////
    domains: t.connection({
      description: "Find Domains by Name.",
      type: DomainInterfaceRef,
      args: {
        where: t.arg({ type: DomainsWhereInput, required: true }),
        order: t.arg({ type: DomainsOrderInput }),
      },
      resolve: (_, { where, order, ...connectionArgs }, context) => {
        const base = domainsBase();
        const named = filterByName(base, where.name);
        const canonical = where.canonical === true ? filterByCanonical(named) : named;
        const domains = withOrderingMetadata(canonical);

        return resolveFindDomains(context, { domains, order, ...connectionArgs });
      },
    }),

    //////////////////////////////////
    // Get Domain by Name or DomainId
    //////////////////////////////////
    domain: t.field({
      description: "Identify a Domain by Name or DomainId",
      type: DomainInterfaceRef,
      args: { by: t.arg({ type: DomainIdInput, required: true }) },
      nullable: true,
      resolve: (parent, args, ctx, info) => {
        if (args.by.id !== undefined) return args.by.id;
        return getDomainIdByInterpretedName(args.by.name);
      },
    }),

    /////////////////////////////////////
    // Get Account by Id or Address
    /////////////////////////////////////
    account: t.field({
      description: "Identify an Account by ID or Address.",
      type: AccountRef,
      args: { by: t.arg({ type: AccountByInput, required: true }) },
      resolve: (parent, args, context, info) => args.by.id ?? args.by.address,
    }),

    ///////////////////////////////////
    // Get Registry by Id or AccountId
    ///////////////////////////////////
    registry: t.field({
      description:
        "Identify a Registry by ID or AccountId. If querying by `contract`, only concrete Registries will be returned.",
      type: RegistryInterfaceRef,
      nullable: true,
      args: { by: t.arg({ type: RegistryIdInput, required: true }) },
      resolve: (parent, args) => args.by.id ?? makeConcreteRegistryId(args.by.contract),
    }),

    ///////////////////////////////////
    // Get Resolver by Id or AccountId
    ///////////////////////////////////
    resolver: t.field({
      description: "Identify a Resolver by ID or AccountId.",
      type: ResolverRef,
      args: { by: t.arg({ type: ResolverIdInput, required: true }) },
      resolve: (parent, args, context, info) => {
        if (args.by.id !== undefined) return args.by.id;
        return makeResolverId(args.by.contract);
      },
    }),

    ///////////////////////////////////////
    // Get Permissions by Id or AccountId
    ///////////////////////////////////////
    permissions: t.field({
      description: "Identify Permissions by ID or AccountId.",
      type: PermissionsRef,
      args: { by: t.arg({ type: PermissionsIdInput, required: true }) },
      resolve: (parent, args, context, info) => {
        if (args.by.id !== undefined) return args.by.id;
        return makePermissionsId(args.by.contract);
      },
    }),

    /////////////////////
    // Get Root Registry
    /////////////////////
    root: t.field({
      description:
        "The Root Registry for this namespace. It will be the ENSv2 Root Registry when defined or the ENSv1 Root Registry.",
      type: RegistryInterfaceRef,
      nullable: false,
      resolve: () => getRootRegistryId(config.namespace),
    }),
  }),
});
