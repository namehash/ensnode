import { bigintToCoinType, type ResolverRecordsId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-id";
import { db } from "@/lib/db";

export const ResolverRecordsRef = builder.loadableObjectRef("ResolverRecords", {
  load: (ids: ResolverRecordsId[]) =>
    db.query.resolverRecords.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
      with: { textRecords: true, addressRecords: true },
    }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type ResolverRecords = Exclude<typeof ResolverRecordsRef.$inferType, ResolverRecordsId>;

ResolverRecordsRef.implement({
  description: "TODO",
  fields: (t) => ({
    //////////////////////
    // ResolverRecords.id
    //////////////////////
    id: t.expose("id", {
      description: "TODO",
      type: "ID",
      nullable: false,
    }),

    ////////////////////////
    // ResolverRecords.name
    ////////////////////////
    name: t.expose("name", {
      description: "TODO",
      type: "String",
      nullable: true,
    }),

    ////////////////////////
    // ResolverRecords.keys
    ////////////////////////
    keys: t.field({
      description: "TODO",
      type: ["String"],
      nullable: false,
      resolve: (parent) => parent.textRecords.map((r) => r.key).toSorted(),
    }),

    /////////////////////////////
    // ResolverRecords.coinTypes
    /////////////////////////////
    coinTypes: t.field({
      description: "TODO",
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
