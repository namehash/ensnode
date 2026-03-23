import type { RenewalId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { EventRef } from "@/graphql-api/schema/event";
import { ensDb } from "@/lib/ensdb/singleton";

export const RenewalRef = builder.loadableObjectRef("Renewal", {
  load: (ids: RenewalId[]) =>
    ensDb.query.renewal.findMany({
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
  description: "A Renewal represents an extension of a Registration's expiry.",
  fields: (t) => ({
    //////////////
    // Renewal.id
    //////////////
    id: t.field({
      description: "A unique reference to this Renewal.",
      type: "RenewalId",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ////////////////////
    // Renewal.duration
    ////////////////////
    duration: t.field({
      description: "The duration for which a Registration was extended.",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.duration,
    }),

    ////////////////////
    // Renewal.referrer
    ////////////////////
    referrer: t.field({
      description: "The extra `referrer` data provided with a Renewal, if exists.",
      type: "Hex",
      nullable: true,
      resolve: (parent) => parent.referrer,
    }),

    ////////////////
    // Renewal.base
    ////////////////
    base: t.field({
      description: "The `base` cost of a Renewal, in wei, if exists.",
      type: "BigInt",
      nullable: true,
      resolve: (parent) => parent.base,
    }),

    ///////////////////
    // Renewal.premium
    ///////////////////
    premium: t.field({
      description: "The `premium` cost of a Renewal, in wei, if exists.",
      type: "BigInt",
      nullable: true,
      resolve: (parent) => parent.premium,
    }),

    //////////////////////
    // Renewal.event
    //////////////////////
    event: t.field({
      description: "The Event for which this Renewal was created.",
      type: EventRef,
      nullable: false,
      resolve: (parent) => parent.eventId,
    }),

    // TODO(paymentToken): add payment token tracking here
  }),
});
