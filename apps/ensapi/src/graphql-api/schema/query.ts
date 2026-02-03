import config from "@/config";

import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and } from "drizzle-orm";

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
import {
  cursorFilter,
  type DomainWithOrderValue,
  findDomains,
  getOrderValueFromResult,
  isEffectiveDesc,
  orderFindDomains,
} from "@/graphql-api/lib/find-domains";
import { getDomainIdByInterpretedName } from "@/graphql-api/lib/get-domain-by-fqdn";
import { rejectAnyErrors } from "@/graphql-api/lib/reject-any-errors";
import { AccountRef } from "@/graphql-api/schema/account";
import { AccountIdInput } from "@/graphql-api/schema/account-id";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { cursors } from "@/graphql-api/schema/cursors";
import {
  DOMAINS_DEFAULT_ORDER_BY,
  DOMAINS_DEFAULT_ORDER_DIR,
  DomainCursor,
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
      // Query.domains (Testing)
      /////////////////////////////
      domains: t.connection({
        description: "TODO",
        type: DomainInterfaceRef,
        args: {
          where: t.arg({ type: DomainsWhereInput, required: true }),
          order: t.arg({ type: DomainsOrderInput }),
        },
        resolve: (parent, args, context) => {
          const orderBy = args.order?.by ?? DOMAINS_DEFAULT_ORDER_BY;
          const orderDir = args.order?.dir ?? DOMAINS_DEFAULT_ORDER_DIR;

          return resolveCursorConnection(
            {
              ...DEFAULT_CONNECTION_ARGS,
              args,
              toCursor: (domain: DomainWithOrderValue) =>
                DomainCursor.encode({
                  id: domain.id,
                  by: orderBy,
                  value: domain.__orderValue,
                }),
            },
            async ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) => {
              const effectiveDesc = isEffectiveDesc(orderDir, inverted);

              // construct query for relevant domains
              const domains = findDomains(args.where);

              // build order clauses
              const orderClauses = orderFindDomains(domains, orderBy, orderDir, inverted);

              // decode cursors for keyset pagination
              const beforeCursor = before ? DomainCursor.decode(before) : undefined;
              const afterCursor = after ? DomainCursor.decode(after) : undefined;

              // execute with pagination constraints using tuple comparison
              const results = await db
                .with(domains)
                .select()
                .from(domains)
                .where(
                  and(
                    beforeCursor
                      ? cursorFilter(domains, beforeCursor, orderBy, "before", effectiveDesc)
                      : undefined,
                    afterCursor
                      ? cursorFilter(domains, afterCursor, orderBy, "after", effectiveDesc)
                      : undefined,
                  ),
                )
                .orderBy(...orderClauses)
                .limit(limit);

              // Map CTE results by id for order value lookup
              const orderValueById = new Map(
                results.map((r) => [r.id, getOrderValueFromResult(r, orderBy)]),
              );

              // Load full Domain entities via dataloader
              const loadedDomains = await rejectAnyErrors(
                DomainInterfaceRef.getDataloader(context).loadMany(
                  results.map((result) => result.id),
                ),
              );

              // Attach order values for cursor encoding
              return loadedDomains.map((domain) => ({
                ...domain,
                __orderValue: orderValueById.get(domain.id),
              }));
            },
          );
        },
      }),

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
