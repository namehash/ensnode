/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: ignore unused resolve arguments */

import config from "@/config";

import { namehash } from "viem";

import { DatasourceNames, getDatasource } from "@ensnode/datasources";
import { serializeAccountId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { AccountRef } from "@/graphql-api/schema/account";
import { NameInNamespaceRef, NameOrNodeInput } from "@/graphql-api/schema/name-in-namespace";
import {
  type RegistryContract,
  RegistryContractRef,
  RegistryIdInput,
  RegistryInterface,
} from "@/graphql-api/schema/registry";
import { db } from "@/lib/db";

builder.queryType({
  fields: (t) => ({
    /////////////////////////////////////////
    // Get Name in Namespace by Node or FQDN
    /////////////////////////////////////////
    name: t.field({
      description: "TODO",
      type: NameInNamespaceRef,
      args: {
        id: t.arg({ type: NameOrNodeInput, required: true }),
      },
      resolve: async (parent, args, ctx, info) => {
        // TODO(dataloader): just return node
        // TODO: make sure `namehash` is encoded-label-hash-aware
        const node = args.id.node ? args.id.node : namehash(args.id.name);

        const name = await db.query.nameInNamespace.findFirst({
          where: (t, { eq }) => eq(t.node, node),
        });

        return name;
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
      type: RegistryInterface,
      args: {
        id: t.arg({ type: RegistryIdInput, required: true }),
      },
      resolve: async (parent, args, ctx, info) => {
        // TODO(dataloader): just return registryId
        const registryId = args.id.contract
          ? serializeAccountId(args.id.contract)
          : args.id.implicit.parent;

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
        // TODO: remove, helps types while implementing
        if (config.ensIndexerPublicConfig.namespace !== "ens-test-env") throw new Error("nope");

        // TODO(dataloader): just return rootRegistry id
        const datasource = getDatasource(
          config.ensIndexerPublicConfig.namespace,
          DatasourceNames.ENSRoot,
        );

        const registryId = serializeAccountId({
          chainId: datasource.chain.id,
          address: datasource.contracts.RootRegistry.address,
        });

        const rootRegistry = await db.query.registry.findFirst({
          where: (t, { eq }) => eq(t.id, registryId),
        });

        if (!rootRegistry) throw new Error(`Invariant: Root Registry expected.`);

        return rootRegistry as RegistryContract;
      },
    }),
  }),
});
