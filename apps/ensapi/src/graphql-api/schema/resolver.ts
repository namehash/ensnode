import { namehash } from "viem";

import {
  makeResolverRecordsId,
  NODE_ANY,
  type RequiredAndNotNull,
  type ResolverId,
} from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-id";
import { AccountRef } from "@/graphql-api/schema/account";
import { AccountIdInput, AccountIdRef } from "@/graphql-api/schema/account-id";
import { NameOrNodeInput } from "@/graphql-api/schema/name-or-node";
import { ResolverRecordsRef } from "@/graphql-api/schema/resolver-records";
import { db } from "@/lib/db";

const isDedicatedResolver = (resolver: Resolver): resolver is DedicatedResolver =>
  resolver.isDedicated === true;

const isBridgedResolver = (resolver: Resolver): resolver is BridgedResolver =>
  resolver.bridgesToRegistryChainId !== null && resolver.bridgesToRegistryAddress !== null;

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
export type DedicatedResolver = Omit<Resolver, "isDedicated"> & { isDedicated: true };
export type BridgedResolver = RequiredAndNotNull<
  Resolver,
  "bridgesToRegistryChainId" | "bridgesToRegistryAddress"
>;

////////////
// Resolver
////////////
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

    //////////////////////
    // Resolver.dedicated
    //////////////////////
    dedicated: t.field({
      description: "TODO",
      type: DedicatedResolverMetadataRef,
      nullable: true,
      resolve: (parent) => (isDedicatedResolver(parent) ? parent : null),
    }),

    ////////////////////
    // Resolver.bridged
    ////////////////////
    bridged: t.field({
      description: "TODO",
      type: AccountIdRef,
      nullable: true,
      resolve: (parent) => {
        if (!isBridgedResolver(parent)) return null;
        return {
          chainId: parent.bridgesToRegistryChainId,
          address: parent.bridgesToRegistryAddress,
        };
      },
    }),
  }),
});

/////////////////////////////
// DedicatedResolverMetadata
/////////////////////////////
export const DedicatedResolverMetadataRef = builder.objectRef<Resolver>(
  "DedicatedResolverMetadataRef",
);
DedicatedResolverMetadataRef.implement({
  description: "TODO",
  fields: (t) => ({
    ///////////////////////////
    // DedicatedResolver.owner
    ///////////////////////////
    owner: t.field({
      description: "TODO",
      type: AccountRef,
      nullable: true,
      // TODO: resolve via EAC
      resolve: (parent) => parent.ownerId,
    }),

    /////////////////////////////
    // Resolver.dedicatedRecords
    /////////////////////////////
    records: t.field({
      description: "TODO",
      type: ResolverRecordsRef,
      nullable: true,
      resolve: ({ chainId, address }, args) =>
        makeResolverRecordsId({ chainId, address }, NODE_ANY),
    }),
  }),
});

/////////////////////
// Inputs
/////////////////////

export const ResolverIdInput = builder.inputType("ResolverIdInput", {
  description: "TODO",
  isOneOf: true,
  fields: (t) => ({
    id: t.field({ type: "ResolverId" }),
    contract: t.field({ type: AccountIdInput }),
  }),
});
