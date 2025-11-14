import { namehash } from "viem";

import {
  bigintToCoinType,
  makeResolverRecordsId,
  type ResolverId,
  type ResolverRecordsId,
} from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-id";
import { AccountIdInput, AccountIdRef } from "@/graphql-api/schema/account-id";
import { NameOrNodeInput } from "@/graphql-api/schema/name-or-node";
import { db } from "@/lib/db";

export const ResolverRef = builder.loadableObjectRef("Resolver", {
  load: (ids: ResolverId[]) =>
    db.query.resolver.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
    }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type Resolver = Exclude<typeof ResolverRef.$inferType, ResolverId>;

export const ResolverRecordsRef = builder.loadableObjectRef("ResolverRecords", {
  load: (ids: ResolverRecordsId[]) =>
    db.query.resolverRecords.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
      with: { textRecords: true, addressRecords: true },
    }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

ResolverRef.implement({
  description: "A Resolver Contract",
  fields: (t) => ({
    ///////////////
    // Resolver.id
    ///////////////
    id: t.expose("id", {
      type: "ID",
      description: "TODO",
      nullable: false,
    }),

    /////////////////////
    // Resolver.contract
    /////////////////////
    contract: t.field({
      description: "TODO",
      type: AccountIdRef,
      nullable: false,
      resolve: ({ chainId, address }) => ({ chainId, address }),
    }),

    ////////////////////
    // Resolver.records
    ////////////////////
    // TODO: connection to all ResolverRecords by (address, chainId)?

    ////////////////////////////////////
    // Resolver.records by Name or Node
    ////////////////////////////////////
    records: t.field({
      description: "TODO",
      type: ResolverRecordsRef,
      args: { for: t.arg({ type: NameOrNodeInput, required: true }) },
      nullable: true,
      resolve: async ({ chainId, address }, args) => {
        const node = args.for.node ?? namehash(args.for.name);
        return makeResolverRecordsId({ chainId, address }, node);
      },
    }),
  }),
});

export type ResolverRecords = Exclude<typeof ResolverRecordsRef.$inferType, ResolverRecordsId>;

ResolverRecordsRef.implement({
  description: "TODO",
  fields: (t) => ({
    //////////////////////
    // ResolverRecords.id
    //////////////////////
    id: t.expose("id", {
      description: "TODO",
      type: "ID",
      nullable: false,
    }),

    ////////////////////////
    // ResolverRecords.name
    ////////////////////////
    name: t.expose("name", {
      description: "TODO",
      type: "String",
      nullable: true,
    }),

    ////////////////////////
    // ResolverRecords.keys
    ////////////////////////
    keys: t.field({
      description: "TODO",
      type: ["String"],
      nullable: false,
      resolve: (parent) => parent.textRecords.map((r) => r.key).toSorted(),
    }),

    /////////////////////////////
    // ResolverRecords.coinTypes
    /////////////////////////////
    coinTypes: t.field({
      description: "TODO",
      type: ["CoinType"],
      nullable: false,
      resolve: (parent) =>
        parent.addressRecords
          .map((r) => r.coinType)
          .map(bigintToCoinType)
          .toSorted(),
    }),
  }),
});

export const ResolverIdInput = builder.inputType("ResolverIdInput", {
  description: "TODO",
  isOneOf: true,
  fields: (t) => ({
    id: t.field({ type: "ResolverId" }),
    contract: t.field({ type: AccountIdInput }),
  }),
});
