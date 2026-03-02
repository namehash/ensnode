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

    //////////////
    // Event.from
    //////////////
    from: t.field({
      description: "Identifies the sender of the Transaction within which this Event was emitted.",
      type: "Address",
      nullable: false,
      resolve: (parent) => parent.from,
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
  }),
});
