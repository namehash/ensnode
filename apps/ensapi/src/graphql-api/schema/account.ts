import type { Address } from "viem";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-id";
import { type Domain, DomainRef } from "@/graphql-api/schema/domain";
import { db } from "@/lib/db";

export const AccountRef = builder.loadableObjectRef("Account", {
  load: (ids: Address[]) =>
    db.query.account.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
    }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type Account = Exclude<typeof AccountRef.$inferType, Address>;

AccountRef.implement({
  description: "TODO",
  fields: (t) => ({
    ///////////////////
    // Account.id
    ///////////////////
    id: t.expose("id", {
      description: "TODO",
      type: "Address",
      nullable: false,
    }),

    ///////////////////
    // Account.address
    ///////////////////
    address: t.field({
      description: "TODO",
      type: "Address",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ///////////////////
    // Account.domains
    ///////////////////
    domains: t.loadableGroup({
      description: "TODO",
      type: DomainRef,
      load: (ids: Address[]) =>
        db.query.domain.findMany({
          where: (t, { inArray }) => inArray(t.ownerId, ids),
          with: { label: true },
        }),
      // biome-ignore lint/style/noNonNullAssertion: guaranteed due to inArray
      group: (domain) => (domain as Domain).ownerId!,
      resolve: getModelId,
    }),
  }),
});
