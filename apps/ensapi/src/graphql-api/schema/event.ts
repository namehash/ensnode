import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { db } from "@/lib/db";

export const EventRef = builder.loadableObjectRef("Event", {
  load: (ids: string[]) =>
    db.query.event.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
    }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type Event = Exclude<typeof EventRef.$inferType, string>;

/////////
// Event
/////////
EventRef.implement({
  description:
    "An Event represents a discrete Log Event that was emitted on an EVM chain, including associated metadata.",
  fields: (t) => ({
    //////////////
    // Event.id
    //////////////
    id: t.field({
      description: "A unique reference to this Event.",
      type: "ID",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ///////////////////
    // Event.chainId
    ///////////////////
    chainId: t.field({
      description: "The ChainId upon which this Event was emitted.",
      type: "ChainId",
      nullable: false,
      resolve: (parent) => parent.chainId,
    }),

    /////////////////////
    // Event.blockNumber
    /////////////////////
    blockNumber: t.field({
      description: "The block number within which this Event was emitted.",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.blockNumber,
    }),

    ///////////////////
    // Event.blockHash
    ///////////////////
    blockHash: t.field({
      description: "Identifies the Block within which this Event was emitted.",
      type: "Hex",
      nullable: false,
      resolve: (parent) => parent.blockHash,
    }),

    ///////////////////
    // Event.timestamp
    ///////////////////
    timestamp: t.field({
      description: "The UnixTimestamp indicating the moment in which this Event was emitted.",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.timestamp,
    }),

    /////////////////////////
    // Event.transactionHash
    /////////////////////////
    transactionHash: t.field({
      description: "Identifies the Transaction within which this Event was emitted.",
      type: "Hex",
      nullable: false,
      resolve: (parent) => parent.transactionHash,
    }),

    ////////////////////////////
    // Event.transactionIndex
    ////////////////////////////
    transactionIndex: t.field({
      description: "The index of the Transaction within the Block.",
      type: "Int",
      nullable: false,
      resolve: (parent) => parent.transactionIndex,
    }),

    //////////////
    // Event.from
    //////////////
    from: t.field({
      description: "Identifies the sender of the Transaction within which this Event was emitted.",
      type: "Address",
      nullable: false,
      resolve: (parent) => parent.from,
    }),

    ////////////
    // Event.to
    ////////////
    to: t.field({
      description:
        "Identifies the recipient of the Transaction within which this Event was emitted. Null if the transaction deployed a contract.",
      type: "Address",
      nullable: true,
      resolve: (parent) => parent.to,
    }),

    ///////////////////
    // Event.address
    ///////////////////
    address: t.field({
      description: "Identifies the contract by which this Event was emitted.",
      type: "Address",
      nullable: false,
      resolve: (parent) => parent.address,
    }),

    //////////////////
    // Event.logIndex
    //////////////////
    logIndex: t.field({
      description: "The index of this Event's log within the Block.",
      type: "Int",
      nullable: false,
      resolve: (parent) => parent.logIndex,
    }),

    ////////////////
    // Event.topics
    ////////////////
    topics: t.field({
      description: "The indexed topics of this Event's log.",
      type: ["Hex"],
      nullable: false,
      resolve: (parent) => parent.topics,
    }),

    //////////////
    // Event.data
    //////////////
    data: t.field({
      description: "The non-indexed data of this Event's log.",
      type: "Hex",
      nullable: false,
      resolve: (parent) => parent.data,
    }),
  }),
});

//////////
// Inputs
//////////

/**
 * Shared filter for events connections. Used by Domain.events, Resolver.events, Permissions.events,
 * and Account.events (which excludes `from` since it's implied).
 */
export const EventsWhereInput = builder.inputType("EventsWhereInput", {
  description: "Filter conditions for an events connection.",
  fields: (t) => ({
    topic0_in: t.field({
      type: ["Hex"],
      description: "Filter to events whose topic0 (event signature) is one of the provided values.",
    }),
    timestamp_gte: t.field({
      type: "BigInt",
      description: "Filter to events at or after this UnixTimestamp.",
    }),
    timestamp_lte: t.field({
      type: "BigInt",
      description: "Filter to events at or before this UnixTimestamp.",
    }),
    from: t.field({
      type: "Address",
      description: "Filter to events sent by this address.",
    }),
  }),
});

/**
 * Like EventsWhereInput but without `from` (used where `from` is implied, e.g. Account.events).
 */
export const AccountEventsWhereInput = builder.inputType("AccountEventsWhereInput", {
  description: "Filter conditions for Account.events (where `from` is implied by the Account).",
  fields: (t) => ({
    topic0_in: t.field({
      type: ["Hex"],
      description: "Filter to events whose topic0 (event signature) is one of the provided values.",
    }),
    timestamp_gte: t.field({
      type: "BigInt",
      description: "Filter to events at or after this UnixTimestamp.",
    }),
    timestamp_lte: t.field({
      type: "BigInt",
      description: "Filter to events at or before this UnixTimestamp.",
    }),
  }),
});
