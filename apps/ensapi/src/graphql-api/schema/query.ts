import config from "@/config";

import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";

import {
  type ENSv1DomainId,
  type ENSv2DomainId,
  getRootRegistryId,
  makePermissionsId,
  makeRegistryId,
  makeResolverId,
} from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getDomainIdByInterpretedName } from "@/graphql-api/lib/get-domain-by-fqdn";
import { AccountRef } from "@/graphql-api/schema/account";
import { AccountIdInput } from "@/graphql-api/schema/account-id";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { cursors } from "@/graphql-api/schema/cursors";
import {
  DomainIdInput,
  DomainInterfaceRef,
  ENSv1DomainRef,
  ENSv2DomainRef,
} from "@/graphql-api/schema/domain";
import { PermissionsRef } from "@/graphql-api/schema/permissions";
import { RegistryIdInput, RegistryRef } from "@/graphql-api/schema/registry";
import { ResolverIdInput, ResolverRef } from "@/graphql-api/schema/resolver";
import { db } from "@/lib/db";

builder.queryType({
  fields: (t) => ({
    /////////////////////
    // Query.v1Domains (Testing)
    /////////////////////
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
                  ...[
                    before !== undefined && lt(t.id, cursors.decode<ENSv1DomainId>(before)),
                    after !== undefined && gt(t.id, cursors.decode<ENSv1DomainId>(after)),
                  ].filter((c) => !!c),
                ),
              orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
              limit,
              with: { label: true },
            }),
        ),
    }),

    /////////////////////
    // Query.v2Domains (Testing)
    /////////////////////
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
                  ...[
                    before !== undefined && lt(t.id, cursors.decode<ENSv2DomainId>(before)),
                    after !== undefined && gt(t.id, cursors.decode<ENSv2DomainId>(after)),
                  ].filter((c) => !!c),
                ),
              orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
              limit,
              with: { label: true },
            }),
        ),
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

    //////////////////////
    // Get Registry by Id
    //////////////////////
    registry: t.field({
      description: "TODO",
      type: RegistryRef,
      args: { by: t.arg({ type: RegistryIdInput, required: true }) },
      resolve: async (parent, args, context, info) => {
        if (args.by.id !== undefined) return args.by.id;
        return makeRegistryId(args.by.contract);
      },
    }),

    //////////////////////
    // Get Resolver by Id
    //////////////////////
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
      resolve: () => getRootRegistryId(config.namespace),
    }),
  }),
});
