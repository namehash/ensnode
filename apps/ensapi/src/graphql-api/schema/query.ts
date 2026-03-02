import config from "@/config";

import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";

import {
  type ENSv1DomainId,
  type ENSv2DomainId,
  getENSv2RootRegistryId,
  makePermissionsId,
  makeRegistryId,
  makeResolverId,
  type RegistrationId,
  type ResolverId,
} from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { resolveFindDomains } from "@/graphql-api/lib/find-domains/find-domains-resolver";
import {
  domainsBase,
  filterByCanonical,
  filterByName,
  withOrderingMetadata,
} from "@/graphql-api/lib/find-domains/layers";
import { getDomainIdByInterpretedName } from "@/graphql-api/lib/get-domain-by-interpreted-name";
import { AccountRef } from "@/graphql-api/schema/account";
import { AccountIdInput } from "@/graphql-api/schema/account-id";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { cursors } from "@/graphql-api/schema/cursors";
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
        resolve: (parent, args, context) =>
          resolveCursorConnection(
            { ...DEFAULT_CONNECTION_ARGS, args },
            ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
              db.query.v1Domain.findMany({
                where: (t, { lt, gt, and }) =>
                  and(
                    before ? lt(t.id, cursors.decode<ENSv1DomainId>(before)) : undefined,
                    after ? gt(t.id, cursors.decode<ENSv1DomainId>(after)) : undefined,
                  ),
                orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
                limit,
                with: { label: true },
              }),
          ),
      }),

      /////////////////////////////
      // Query.v2Domains (Testing)
      /////////////////////////////
      v2Domains: t.connection({
        description: "TODO",
        type: ENSv2DomainRef,
        resolve: (parent, args, context) =>
          resolveCursorConnection(
            { ...DEFAULT_CONNECTION_ARGS, args },
            ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
              db.query.v2Domain.findMany({
                where: (t, { lt, gt, and }) =>
                  and(
                    before ? lt(t.id, cursors.decode<ENSv2DomainId>(before)) : undefined,
                    after ? gt(t.id, cursors.decode<ENSv2DomainId>(after)) : undefined,
                  ),
                orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
                limit,
                with: { label: true },
              }),
          ),
      }),

      /////////////////////////////
      // Query.resolvers (Testing)
      /////////////////////////////
      resolvers: t.connection({
        description: "TODO",
        type: ResolverRef,
        resolve: (parent, args, context) =>
          resolveCursorConnection(
            { ...DEFAULT_CONNECTION_ARGS, args },
            ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
              db.query.resolver.findMany({
                where: (t, { lt, gt, and }) =>
                  and(
                    before ? lt(t.id, cursors.decode<ResolverId>(before)) : undefined,
                    after ? gt(t.id, cursors.decode<ResolverId>(after)) : undefined,
                  ),
                orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
                limit,
              }),
          ),
      }),

      /////////////////////////////////
      // Query.registrations (Testing)
      /////////////////////////////////
      registrations: t.connection({
        description: "TODO",
        type: RegistrationInterfaceRef,
        resolve: (parent, args, context) =>
          resolveCursorConnection(
            { ...DEFAULT_CONNECTION_ARGS, args },
            ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
              db.query.registration.findMany({
                where: (t, { lt, gt, and }) =>
                  and(
                    before ? lt(t.id, cursors.decode<RegistrationId>(before)) : undefined,
                    after ? gt(t.id, cursors.decode<RegistrationId>(after)) : undefined,
                  ),
                orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
                limit,
              }),
          ),
      }),
    }),

    ////////////////
    // Find Domains
    ////////////////
    domains: t.connection({
      description: "TODO",
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
      description: "TODO",
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
      description: "TODO",
      type: AccountRef,
      args: { address: t.arg({ type: "Address", required: true }) },
      resolve: async (parent, args, context, info) => args.address,
    }),

    ///////////////////////////////////
    // Get Registry by Id or AccountId
    ///////////////////////////////////
    registry: t.field({
      description: "TODO",
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
      description: "TODO",
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
      description: "TODO",
      type: PermissionsRef,
      args: { for: t.arg({ type: AccountIdInput, required: true }) },
      resolve: (parent, args, context, info) => makePermissionsId(args.for),
    }),

    /////////////////////
    // Get Root Registry
    /////////////////////
    root: t.field({
      description: "TODO",
      type: RegistryRef,
      nullable: false,
      resolve: () => getENSv2RootRegistryId(config.namespace),
    }),
  }),
});
