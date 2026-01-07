import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { namehash } from "viem";

import {
  makePermissionsId,
  makeResolverRecordsId,
  NODE_ANY,
  type ResolverId,
  type ResolverRecordsId,
  ROOT_RESOURCE,
} from "@ensnode/ensnode-sdk";
import { isBridgedResolver } from "@ensnode/ensnode-sdk/internal";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { AccountRef } from "@/graphql-api/schema/account";
import { AccountIdInput, AccountIdRef } from "@/graphql-api/schema/account-id";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { cursors } from "@/graphql-api/schema/cursors";
import { NameOrNodeInput } from "@/graphql-api/schema/name-or-node";
import { PermissionsRef, type PermissionsUserResource } from "@/graphql-api/schema/permissions";
import { ResolverRecordsRef } from "@/graphql-api/schema/resolver-records";
import { db } from "@/lib/db";

/**
 * Note that this indexed Resolver entity represents not _all_ Resolver contracts that exist onchain,
 * but the set of Resolver contracts that have emitted at least one event that we are able to index.
 *
 * This means that if one were to access a Resolver contract that _does_ exist on-chain, but hasn't
 * emitted any events (ex: BasenamesL1Resolver), this API (which retrieves data from the index)
 * would say that it doesn't exist.
 *
 * This limitation has always been the case, including for the legacy ENS Subgraph, and would require
 * an RPC call to the chain be performed in the case that a Resolver doesn't exist in the index, which
 * is prohibitive in both cost and latency. As such we acknowledge this limitation here, for now.
 */

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

    //////////////////////
    // Resolver.dedicated
    //////////////////////
    dedicated: t.field({
      description: "TODO",
      type: DedicatedResolverMetadataRef,
      nullable: true,
      resolve: async (parent, args, context) =>
        db.query.permissionsUser.findFirst({
          where: (t, { eq, and }) =>
            and(
              eq(t.chainId, parent.chainId),
              eq(t.address, parent.address),
              eq(t.resource, ROOT_RESOURCE),
            ),
        }),
    }),

    ////////////////////
    // Resolver.bridged
    ////////////////////
    bridged: t.field({
      description: "TODO",
      type: AccountIdRef,
      nullable: true,
      resolve: (parent, args, context) => isBridgedResolver(context.namespace, parent),
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
export const DedicatedResolverMetadataRef = builder.objectRef<PermissionsUserResource>(
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
      nullable: false,
      resolve: (parent) => parent.user,
    }),

    /////////////////////////////////
    // DedicatedResolver.permissions
    /////////////////////////////////
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
