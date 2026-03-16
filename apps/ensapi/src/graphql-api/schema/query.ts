import config from "@/config";

import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";

import * as schema from "@ensnode/ensnode-schema";
import {
  makePermissionsId,
  makeRegistryId,
  makeResolverId,
  maybeGetENSv2RootRegistryId,
} from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { orderPaginationBy, paginateBy } from "@/graphql-api/lib/connection-helpers";
import { resolveFindDomains } from "@/graphql-api/lib/find-domains/find-domains-resolver";
import {
  domainsBase,
  filterByCanonical,
  filterByName,
  withOrderingMetadata,
} from "@/graphql-api/lib/find-domains/layers";
import { getDomainIdByInterpretedName } from "@/graphql-api/lib/get-domain-by-interpreted-name";
import { lazyConnection } from "@/graphql-api/lib/lazy-connection";
import { AccountRef } from "@/graphql-api/schema/account";
import { AccountIdInput } from "@/graphql-api/schema/account-id";
import { ID_PAGINATED_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import {
  DomainIdInput,
  DomainInterfaceRef,
  DomainsOrderInput,
  DomainsWhereInput,
  ENSv1DomainRef,
  ENSv2DomainRef,
} from "@/graphql-api/schema/domain";
import { PermissionsRef } from "@/graphql-api/schema/permissions";
import { RegistrationInterfaceRef } from "@/graphql-api/schema/registration";
import { RegistryIdInput, RegistryRef } from "@/graphql-api/schema/registry";
import { ResolverIdInput, ResolverRef } from "@/graphql-api/schema/resolver";
import { db } from "@/lib/db";

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
            totalCount: () => db.$count(schema.v1Domain),
            connection: () =>
              resolveCursorConnection(
                { ...ID_PAGINATED_CONNECTION_ARGS, args },
                ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                  db.query.v1Domain.findMany({
                    where: paginateBy(schema.v1Domain.id, before, after),
                    orderBy: orderPaginationBy(schema.v1Domain.id, inverted),
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
            totalCount: () => db.$count(schema.v2Domain),
            connection: () =>
              resolveCursorConnection(
                { ...ID_PAGINATED_CONNECTION_ARGS, args },
                ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                  db.query.v2Domain.findMany({
                    where: paginateBy(schema.v2Domain.id, before, after),
                    orderBy: orderPaginationBy(schema.v2Domain.id, inverted),
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
            totalCount: () => db.$count(schema.resolver),
            connection: () =>
              resolveCursorConnection(
                { ...ID_PAGINATED_CONNECTION_ARGS, args },
                ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                  db
                    .select()
                    .from(schema.resolver)
                    .where(paginateBy(schema.resolver.id, before, after))
                    .orderBy(orderPaginationBy(schema.resolver.id, inverted))
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
            totalCount: () => db.$count(schema.registration),
            connection: () =>
              resolveCursorConnection(
                { ...ID_PAGINATED_CONNECTION_ARGS, args },
                ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                  db
                    .select()
                    .from(schema.registration)
                    .where(paginateBy(schema.registration.id, before, after))
                    .orderBy(orderPaginationBy(schema.registration.id, inverted))
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
      resolve: async (parent, args, ctx, info) => {
        if (args.by.id !== undefined) return args.by.id;
        return getDomainIdByInterpretedName(args.by.name);
      },
    }),

    //////////////////////////
    // Get Account by address
    //////////////////////////
    account: t.field({
      description: "Identify an Account by Address.",
      type: AccountRef,
      args: { address: t.arg({ type: "Address", required: true }) },
      resolve: async (parent, args, context, info) => args.address,
    }),

    ///////////////////////////////////
    // Get Registry by Id or AccountId
    ///////////////////////////////////
    registry: t.field({
      description: "Identify a Registry by ID or AccountId.",
      type: RegistryRef,
      args: { by: t.arg({ type: RegistryIdInput, required: true }) },
      resolve: async (parent, args, context, info) => {
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
      resolve: async (parent, args, context, info) => {
        if (args.by.id !== undefined) return args.by.id;
        return makeResolverId(args.by.contract);
      },
    }),

    ///////////////////////////////
    // Get Permissions by Contract
    ///////////////////////////////
    permissions: t.field({
      description: "Find Permissions in a contract by AccountId.",
      type: PermissionsRef,
      args: { for: t.arg({ type: AccountIdInput, required: true }) },
      resolve: (parent, args, context, info) => makePermissionsId(args.for),
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
