/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: ignore unused resolve arguments */

import { type ImplicitRegistryId, makeRegistryContractId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import type { RegistryContract } from "@/graphql-api/lib/db-types";
import { getDomainIdByInterpretedName } from "@/graphql-api/lib/get-domain-by-fqdn";
import { AccountRef } from "@/graphql-api/schema/account";
import { DomainRef } from "@/graphql-api/schema/domain";
import {
  RegistryContractRef,
  RegistryIdInput,
  RegistryInterfaceRef,
} from "@/graphql-api/schema/registry";
import { db } from "@/lib/db";
import { ROOT_REGISTRY_ID } from "@/lib/root-registry";

builder.queryType({
  fields: (t) => ({
    //////////////////////
    // Get Domain by FQDN
    //////////////////////
    name: t.field({
      description: "TODO",
      type: DomainRef,
      args: {
        fqdn: t.arg({ type: "Name", required: true }),
      },
      nullable: true,
      resolve: async (parent, args, ctx, info) => {
        const domainId = await getDomainIdByInterpretedName(args.fqdn);
        // TODO: traverse the namegraph to identify the addressed Domain
        // TODO(dataloader): just return domainId

        if (!domainId) return null;

        return await db.query.domain.findFirst({
          where: (t, { eq }) => eq(t.id, domainId),
        });
      },
    }),

    /////////////////////////////////////////
    // Get Account by address
    /////////////////////////////////////////
    account: t.field({
      description: "TODO",
      type: AccountRef,
      args: {
        address: t.arg({ type: "Address", required: true }),
      },
      resolve: async (parent, args, ctx, info) => {
        // TODO(dataloader): just return address

        const account = await db.query.account.findFirst({
          where: (t, { eq }) => eq(t.address, args.address),
        });

        return account;
      },
    }),

    //////////////////////
    // Get Registry by Id
    //////////////////////
    registry: t.field({
      description: "TODO",
      type: RegistryInterfaceRef,
      args: {
        id: t.arg({ type: RegistryIdInput, required: true }),
      },
      resolve: async (parent, args, ctx, info) => {
        // TODO(dataloader): just return registryId
        const registryId = args.id.contract
          ? makeRegistryContractId(args.id.contract)
          : (args.id.implicit.parent as ImplicitRegistryId); // TODO: move this case into scalar

        const registry = await db.query.registry.findFirst({
          where: (t, { eq }) => eq(t.id, registryId),
        });

        return registry;
      },
    }),

    /////////////////
    // Get Root Registry
    /////////////////
    root: t.field({
      type: RegistryContractRef,
      description: "TODO",
      nullable: false,
      resolve: async () => {
        // TODO(dataloader): just return rootRegistry id
        const rootRegistry = await db.query.registry.findFirst({
          where: (t, { eq }) => eq(t.id, ROOT_REGISTRY_ID),
        });

        if (!rootRegistry) throw new Error(`Invariant: Root Registry expected.`);

        return rootRegistry as RegistryContract;
      },
    }),
  }),
});
