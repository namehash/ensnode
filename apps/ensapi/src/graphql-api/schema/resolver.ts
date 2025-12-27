import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { namehash } from "viem";

import {
  makePermissionsId,
  makeResolverRecordsId,
  NODE_ANY,
  type RequiredAndNotNull,
  type ResolverId,
  type ResolverRecordsId,
  ROOT_RESOURCE,
} from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { AccountRef } from "@/graphql-api/schema/account";
import { AccountIdInput, AccountIdRef } from "@/graphql-api/schema/account-id";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { cursors } from "@/graphql-api/schema/cursors";
import { NameOrNodeInput } from "@/graphql-api/schema/name-or-node";
import { PermissionsRef } from "@/graphql-api/schema/permissions";
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
    id: t.field({
      description: "TODO",
      type: "ResolverId",
      nullable: false,
      resolve: (parent) => parent.id,
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
    records: t.connection({
      description: "TODO",
      type: ResolverRecordsRef,
      resolve: (parent, args, context) =>
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
            db.query.resolverRecords.findMany({
              where: (t, { lt, gt, and, eq }) =>
                and(
                  ...[
                    eq(t.chainId, parent.chainId),
                    eq(t.address, parent.address),
                    before !== undefined && lt(t.id, cursors.decode<ResolverRecordsId>(before)),
                    after !== undefined && gt(t.id, cursors.decode<ResolverRecordsId>(after)),
                  ].filter((c) => !!c),
                ),
              orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
              limit,
              with: { textRecords: true, addressRecords: true },
            }),
        ),
    }),

    ////////////////////////////////////
    // Resolver.records by Name or Node
    ////////////////////////////////////
    records_: t.field({
      description: "TODO",
      type: ResolverRecordsRef,
      args: { for: t.arg({ type: NameOrNodeInput, required: true }) },
      nullable: true,
      resolve: async ({ chainId, address }, args) => {
        const node = args.for.node ?? namehash(args.for.name);
        return makeResolverRecordsId({ chainId, address }, node);
      },
    }),

    /////////////////////
    // Resolver.extended
    /////////////////////
    extended: t.field({
      description: "TODO",
      type: "Boolean",
      nullable: false,
      resolve: (parent) => parent.isExtended,
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

    ////////////////////////
    // Resolver.permissions
    ////////////////////////
    permissions: t.field({
      description: "TODO",
      type: PermissionsRef,
      resolve: ({ chainId, address }) => makePermissionsId({ chainId, address }),
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
      resolve: async (parent) => {
        const permissionsUser = await db.query.permissionsUser.findFirst({
          where: (t, { eq, and }) =>
            and(
              eq(t.chainId, parent.chainId),
              eq(t.address, parent.address),
              eq(t.resource, ROOT_RESOURCE),
            ),
        });

        return permissionsUser?.user;
      },
    }),

    /////////////////////////////////
    // DedicatedResolver.permissions
    /////////////////////////////////
    // TODO(EAC) — support DedicatedResolver.permissions after EAC change
    permissions: t.field({
      description: "TODO",
      type: PermissionsRef,
      nullable: false,
      // TODO: render a DedicatedResolverPermissions model that parses the backing permissions into dedicated-resolver-semantic roles?
      resolve: ({ chainId, address }) => makePermissionsId({ chainId, address }),
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
