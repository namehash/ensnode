import config from "@/config";

import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, eq } from "drizzle-orm";
import {
  makePermissionsId,
  makeResolverRecordsId,
  namehashInterpretedName,
  type ResolverId,
} from "enssdk";

import { isBridgedResolver } from "@ensnode/ensnode-sdk/internal";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { builder } from "@/omnigraph-api/builder";
import { orderPaginationBy, paginateBy } from "@/omnigraph-api/lib/connection-helpers";
import { resolveFindEvents } from "@/omnigraph-api/lib/find-events/find-events-resolver";
import { getModelId } from "@/omnigraph-api/lib/get-model-id";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { AccountIdInput, AccountIdRef } from "@/omnigraph-api/schema/account-id";
import { ID_PAGINATED_CONNECTION_ARGS } from "@/omnigraph-api/schema/constants";
import { EventRef, EventsWhereInput } from "@/omnigraph-api/schema/event";
import { NameOrNodeInput } from "@/omnigraph-api/schema/name-or-node";
import { PermissionsRef } from "@/omnigraph-api/schema/permissions";
import { ResolverRecordsRef } from "@/omnigraph-api/schema/resolver-records";

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
    ensDb.query.resolver.findMany({
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
          eq(ensIndexerSchema.resolverRecords.chainId, parent.chainId),
          eq(ensIndexerSchema.resolverRecords.address, parent.address),
        );

        return lazyConnection({
          totalCount: () => ensDb.$count(ensIndexerSchema.resolverRecords, scope),
          connection: () =>
            resolveCursorConnection(
              { ...ID_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                ensDb.query.resolverRecords.findMany({
                  where: and(scope, paginateBy(ensIndexerSchema.resolverRecords.id, before, after)),
                  orderBy: orderPaginationBy(ensIndexerSchema.resolverRecords.id, inverted),
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
        const node = args.for.node ?? namehashInterpretedName(args.for.name);
        return makeResolverRecordsId({ chainId, address }, node);
      },
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
            table: ensIndexerSchema.resolverEvent,
            scope: eq(ensIndexerSchema.resolverEvent.resolverId, parent.id),
          },
        }),
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
