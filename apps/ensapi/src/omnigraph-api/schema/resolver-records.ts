import { bigintToCoinType, type ResolverRecordsId } from "@ensnode/ensnode-sdk";

import { ensDb } from "@/lib/ensdb/singleton";
import { builder } from "@/omnigraph-api/builder";
import { getModelId } from "@/omnigraph-api/lib/get-model-id";

export const ResolverRecordsRef = builder.loadableObjectRef("ResolverRecords", {
  load: (ids: ResolverRecordsId[]) =>
    ensDb.query.resolverRecords.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
      with: { textRecords: true, addressRecords: true },
    }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type ResolverRecords = Exclude<typeof ResolverRecordsRef.$inferType, ResolverRecordsId>;

ResolverRecordsRef.implement({
  description: "ResolverRecords represents the _indexed_ records within a Resolver.",
  fields: (t) => ({
    //////////////////////
    // ResolverRecords.id
    //////////////////////
    id: t.field({
      description: "A unique reference to these ResolverRecords.",
      type: "ResolverRecordsId",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ////////////////////////
    // ResolverRecords.node
    ////////////////////////
    node: t.field({
      description: "The Node for which these ResolverRecords are issued.",
      type: "Node",
      nullable: false,
      resolve: (parent) => parent.node,
    }),

    ////////////////////////
    // ResolverRecords.name
    ////////////////////////
    name: t.expose("name", {
      description: "The `name` record for this `node`, if any.",
      type: "String",
      nullable: true,
    }),

    ////////////////////////
    // ResolverRecords.keys
    ////////////////////////
    keys: t.field({
      description: "Unique keys of `text` records for this `node`.",
      type: ["String"],
      nullable: false,
      resolve: (parent) => parent.textRecords.map((r) => r.key).toSorted(),
    }),

    /////////////////////////////
    // ResolverRecords.coinTypes
    /////////////////////////////
    coinTypes: t.field({
      description: "Unique CoinTypes of `addr` records for this `node`.",
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
