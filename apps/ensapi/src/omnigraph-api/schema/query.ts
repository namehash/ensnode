import config from "@/config";

import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { makePermissionsId, makeRegistryId, makeResolverId } from "enssdk";

import { maybeGetENSv2RootRegistryId } from "@ensnode/ensnode-sdk";

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
  ENSv1DomainRef,
  ENSv2DomainRef,
} from "@/omnigraph-api/schema/domain";
import { PermissionsIdInput, PermissionsRef } from "@/omnigraph-api/schema/permissions";
import { RegistrationInterfaceRef } from "@/omnigraph-api/schema/registration";
import { RegistryIdInput, RegistryRef } from "@/omnigraph-api/schema/registry";
import { ResolverIdInput, ResolverRef } from "@/omnigraph-api/schema/resolver";

// don't want them to get familiar/accustomed to these methods until their necessity is certain
const INCLUDE_DEV_METHODS = process.env.NODE_ENV !== "production";

builder.queryType({
  fields: (t) => ({
    ...(INCLUDE_DEV_METHODS && {
      /////////////////////////////
      // Query.v1Domains (Testing)
      /////////////////////////////
      v1Domains: t.connection({
        description: "TODO",
        type: ENSv1DomainRef,
        resolve: (parent, args) =>
          lazyConnection({
            totalCount: () => ensDb.$count(ensIndexerSchema.v1Domain),
            connection: () =>
              resolveCursorConnection(
                { ...ID_PAGINATED_CONNECTION_ARGS, args },
                ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                  ensDb.query.v1Domain.findMany({
                    where: paginateBy(ensIndexerSchema.v1Domain.id, before, after),
                    orderBy: orderPaginationBy(ensIndexerSchema.v1Domain.id, inverted),
                    limit,
                    with: { label: true },
                  }),
              ),
          }),
      }),

      /////////////////////////////
      // Query.v2Domains (Testing)
      /////////////////////////////
      v2Domains: t.connection({
        description: "TODO",
        type: ENSv2DomainRef,
        resolve: (parent, args) =>
          lazyConnection({
            totalCount: () => ensDb.$count(ensIndexerSchema.v2Domain),
            connection: () =>
              resolveCursorConnection(
                { ...ID_PAGINATED_CONNECTION_ARGS, args },
                ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                  ensDb.query.v2Domain.findMany({
                    where: paginateBy(ensIndexerSchema.v2Domain.id, before, after),
                    orderBy: orderPaginationBy(ensIndexerSchema.v2Domain.id, inverted),
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
      description: "Identify a Registry by ID or AccountId.",
      type: RegistryRef,
      args: { by: t.arg({ type: RegistryIdInput, required: true }) },
      resolve: (parent, args, context, info) => {
        if (args.by.id !== undefined) return args.by.id;
        return makeRegistryId(args.by.contract);
      },
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
      description: "The ENSv2 Root Registry, if exists.",
      type: RegistryRef,
      // TODO: make this nullable: false after all namespaces define ENSv2Root
      nullable: true,
      resolve: () => maybeGetENSv2RootRegistryId(config.namespace),
    }),
  }),
});
