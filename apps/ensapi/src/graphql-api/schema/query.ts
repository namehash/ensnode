import config from "@/config";

import { getRootRegistryId, makeRegistryContractId, makeResolverId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getDomainIdByInterpretedName } from "@/graphql-api/lib/get-domain-by-fqdn";
import { AccountRef } from "@/graphql-api/schema/account";
import { DomainIdInput, DomainRef } from "@/graphql-api/schema/domain";
import { RegistryIdInput, RegistryInterfaceRef } from "@/graphql-api/schema/registry";
import { ResolverIdInput, ResolverRef } from "@/graphql-api/schema/resolver";
import { db } from "@/lib/db";

// TODO: maybe should still implement query/return by id, exposing the db's primary key?
// maybe necessary for connections pattern...
// if leaning into opaque ids, then probably prefer that, and avoid exposing semantic searches? unclear

builder.queryType({
  fields: (t) => ({
    domains: t.field({
      description: "DELETE ME",
      type: [DomainRef],
      nullable: false,
      resolve: () => db.query.domain.findMany({ with: { label: true } }),
    }),

    //////////////////////////////////
    // Get Domain by Name or DomainId
    //////////////////////////////////
    domain: t.field({
      description: "TODO",
      type: DomainRef,
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
      resolve: async (parent, args, ctx, info) => args.address,
    }),

    //////////////////////
    // Get Registry by Id
    //////////////////////
    registry: t.field({
      description: "TODO",
      type: RegistryInterfaceRef,
      args: { by: t.arg({ type: RegistryIdInput, required: true }) },
      resolve: async (parent, args, ctx, info) => {
        if (args.by.id !== undefined) return args.by.id;
        if (args.by.implicit !== undefined) return args.by.implicit.parent;
        return makeRegistryContractId(args.by.contract);
      },
    }),

    //////////////////////
    // Get Resolver by Id
    //////////////////////
    resolver: t.field({
      description: "TODO",
      type: ResolverRef,
      args: { by: t.arg({ type: ResolverIdInput, required: true }) },
      resolve: async (parent, args, ctx, info) => {
        if (args.by.id !== undefined) return args.by.id;
        return makeResolverId(args.by.contract);
      },
    }),

    /////////////////////
    // Get Root Registry
    /////////////////////
    root: t.field({
      description: "TODO",
      type: RegistryInterfaceRef,
      nullable: false,
      resolve: () => getRootRegistryId(config.namespace),
    }),
  }),
});
