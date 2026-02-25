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
  description: "TODO",
  fields: (t) => ({
    //////////////
    // Event.id
    //////////////
    id: t.field({
      description: "TODO",
      type: "ID",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ///////////////////
    // Event.chainId
    ///////////////////
    chainId: t.field({
      description: "TODO",
      type: "ChainId",
      nullable: false,
      resolve: (parent) => parent.chainId,
    }),

    ///////////////////
    // Event.address
    ///////////////////
    address: t.field({
      description: "TODO",
      type: "Address",
      nullable: false,
      resolve: (parent) => parent.address,
    }),

    ///////////////////
    // Event.timestamp
    ///////////////////
    timestamp: t.field({
      description: "TODO",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.timestamp,
    }),

    ///////////////////
    // Event.blockHash
    ///////////////////
    blockHash: t.field({
      description: "TODO",
      type: "Hex",
      nullable: false,
      resolve: (parent) => parent.blockHash,
    }),

    /////////////////////////
    // Event.transactionHash
    /////////////////////////
    transactionHash: t.field({
      description: "TODO",
      type: "Hex",
      nullable: false,
      resolve: (parent) => parent.transactionHash,
    }),

    //////////////////
    // Event.logIndex
    //////////////////
    logIndex: t.field({
      description: "TODO",
      type: "Int",
      nullable: false,
      resolve: (parent) => parent.logIndex,
    }),
  }),
});
