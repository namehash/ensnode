import { ensDb } from "@/lib/ensdb/singleton";
import { builder } from "@/omnigraph-api/builder";
import { getModelId } from "@/omnigraph-api/lib/get-model-id";

export const EventRef = builder.loadableObjectRef("Event", {
  load: (ids: string[]) =>
    ensDb.query.event.findMany({
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
      description:
        "Identifies the sender of the Transaction within which this Event was emitted (`tx.from`). Never HCA-aware — always the EOA/relayer that submitted the transaction. Use `Event.sender` for the HCA-aware actor.",
      type: "Address",
      nullable: false,
      resolve: (parent) => parent.from,
    }),

    ////////////////
    // Event.sender
    ////////////////
    sender: t.field({
      description: "The HCA account address if used, otherwise Transaction.from.",
      type: "Address",
      nullable: false,
      resolve: (parent) => parent.sender,
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
 * and Account.events (which excludes `sender` since it's implied).
 */
export const EventsWhereInput = builder.inputType("EventsWhereInput", {
  description: "Filter conditions for an events connection.",
  fields: (t) => ({
    selector_in: t.field({
      type: ["Hex"],
      description:
        "Filter to events whose selector (event signature) is one of the provided values.",
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
      description:
        "Filter to events whose `tx.from` matches. Not HCA-aware — use `sender` to filter by the HCA account address.",
    }),
    sender: t.field({
      type: "Address",
      description:
        "Filter to events whose `sender` matches: the HCA account address if used, otherwise Transaction.from.",
    }),
  }),
});

/**
 * Like EventsWhereInput but without `sender` (used where `sender` is implied, e.g. Account.events).
 */
export const AccountEventsWhereInput = builder.inputType("AccountEventsWhereInput", {
  description: "Filter conditions for Account.events (where `sender` is implied by the Account).",
  fields: (t) => ({
    selector_in: t.field({
      type: ["Hex"],
      description:
        "Filter to events whose selector (event signature) is one of the provided values.",
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
      description:
        "Filter to events whose `tx.from` matches. Not HCA-aware — the Account's HCA-aware filter is applied via `sender = Account.id`.",
    }),
  }),
});
