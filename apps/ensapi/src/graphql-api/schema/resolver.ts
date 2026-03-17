import config from "@/config";

import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, eq } from "drizzle-orm";
import { namehash } from "viem";

import * as schema from "@ensnode/ensdb-sdk";
import {
  makePermissionsId,
  makeResolverRecordsId,
  NODE_ANY,
  type ResolverId,
  ROOT_RESOURCE,
} from "@ensnode/ensnode-sdk";
import { isBridgedResolver } from "@ensnode/ensnode-sdk/internal";

import { builder } from "@/graphql-api/builder";
import { orderPaginationBy, paginateBy } from "@/graphql-api/lib/connection-helpers";
import { resolveFindEvents } from "@/graphql-api/lib/find-events/find-events-resolver";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { lazyConnection } from "@/graphql-api/lib/lazy-connection";
import { AccountRef } from "@/graphql-api/schema/account";
import { AccountIdInput, AccountIdRef } from "@/graphql-api/schema/account-id";
import { ID_PAGINATED_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { EventRef, EventsWhereInput } from "@/graphql-api/schema/event";
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
  description: "A Resolver represents a Resolver contract on-chain.",
  fields: (t) => ({
    ///////////////
    // Resolver.id
    ///////////////
    id: t.field({
      description: "A unique reference to this Resolver.",
      type: "ResolverId",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    /////////////////////
    // Resolver.contract
    /////////////////////
    contract: t.field({
      description: "Contract metadata for this Resolver.",
      type: AccountIdRef,
      nullable: false,
      resolve: ({ chainId, address }) => ({ chainId, address }),
    }),

    ////////////////////
    // Resolver.records
    ////////////////////
    records: t.connection({
      description: "ResolverRecords issued by this Resolver.",
      type: ResolverRecordsRef,
      resolve: (parent, args, context) => {
        const scope = and(
          eq(schema.resolverRecords.chainId, parent.chainId),
          eq(schema.resolverRecords.address, parent.address),
        );

        return lazyConnection({
          totalCount: () => db.$count(schema.resolverRecords, scope),
          connection: () =>
            resolveCursorConnection(
              { ...ID_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                db.query.resolverRecords.findMany({
                  where: and(scope, paginateBy(schema.resolverRecords.id, before, after)),
                  orderBy: orderPaginationBy(schema.resolverRecords.id, inverted),
                  limit,
                  with: { textRecords: true, addressRecords: true },
                }),
            ),
        });
      },
    }),

    ////////////////////////////////////
    // Resolver.records by Name or Node
    ////////////////////////////////////
    records_: t.field({
      description: "Identify a ResolverRecord by `name` or `node`.",
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
      description: "If Resolver is a DedicatedResolver, additional DedicatedResolverMetadata.",
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
      description: "Whether Resolver is a BridgedResolver.",
      type: AccountIdRef,
      nullable: true,
      resolve: (parent) => isBridgedResolver(config.namespace, parent),
    }),

    ////////////////////////
    // Resolver.permissions
    ////////////////////////
    permissions: t.field({
      description: "Permissions granted by this Resolver.",
      type: PermissionsRef,
      resolve: ({ chainId, address }) => makePermissionsId({ chainId, address }),
    }),

    ////////////////////
    // Resolver.events
    ////////////////////
    events: t.connection({
      description: "All Events associated with this Resolver.",
      type: EventRef,
      args: {
        where: t.arg({ type: EventsWhereInput }),
      },
      resolve: (parent, args) =>
        resolveFindEvents(args, {
          through: {
            table: schema.resolverEvent,
            scope: eq(schema.resolverEvent.resolverId, parent.id),
          },
        }),
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
  description: "Represents additional metadata available for DedicatedResolvers.",
  fields: (t) => ({
    ///////////////////////////
    // DedicatedResolver.owner
    ///////////////////////////
    owner: t.field({
      description: "The Account that owns this DedicatedResolver.",
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
      description: "The ResolverRecords issued under `NODE_ANY`.",
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
  description: "Address a Resolver by ID or AccountId.",
  isOneOf: true,
  fields: (t) => ({
    id: t.field({ type: "ResolverId" }),
    contract: t.field({ type: AccountIdInput }),
  }),
});
