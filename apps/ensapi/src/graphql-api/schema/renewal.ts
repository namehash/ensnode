import type { RenewalId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { db } from "@/lib/db";

export const RenewalRef = builder.loadableObjectRef("Renewal", {
  load: (ids: RenewalId[]) =>
    db.query.renewal.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
    }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type Renewal = Exclude<typeof RenewalRef.$inferType, RenewalId>;

///////////
// Renewal
///////////
RenewalRef.implement({
  description: "TODO",
  fields: (t) => ({
    //////////////
    // Renewal.id
    //////////////
    id: t.field({
      description: "TODO",
      type: "ID",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ////////////////////
    // Renewal.duration
    ////////////////////
    duration: t.field({
      description: "TODO",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.duration,
    }),

    ////////////////////
    // Renewal.referrer
    ////////////////////
    referrer: t.field({
      description: "TODO",
      type: "Hex",
      nullable: true,
      resolve: (parent) => parent.referrer,
    }),

    ////////////////
    // Renewal.base
    ////////////////
    base: t.field({
      description: "TODO",
      type: "BigInt",
      nullable: true,
      resolve: (parent) => parent.base,
    }),

    ///////////////////
    // Renewal.premium
    ///////////////////
    premium: t.field({
      description: "TODO",
      type: "BigInt",
      nullable: true,
      resolve: (parent) => parent.premium,
    }),

    // TODO(paymentToken): add payment token tracking here
  }),
});
