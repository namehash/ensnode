/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: ignore unused resolve arguments */

import { makeRegistryContractId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getDomainIdByInterpretedName } from "@/graphql-api/lib/get-domain-by-fqdn";
import { AccountRef } from "@/graphql-api/schema/account";
import { DomainIdInput, DomainRef } from "@/graphql-api/schema/domain";
import { RegistryIdInput, RegistryInterfaceRef } from "@/graphql-api/schema/registry";
import { ROOT_REGISTRY_ID } from "@/lib/root-registry";

// TODO: maybe should still implement query/return by id, exposing the db's primary key?
// maybe necessary for connections pattern...
// if leaning into opaque ids, then probably prefer that, and avoid exposing semantic searches? unclear

builder.queryType({
  fields: (t) => ({
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

    /////////////////////
    // Get Root Registry
    /////////////////////
    root: t.field({
      description: "TODO",
      type: RegistryInterfaceRef,
      nullable: false,
      resolve: () => ROOT_REGISTRY_ID,
    }),
  }),
});
