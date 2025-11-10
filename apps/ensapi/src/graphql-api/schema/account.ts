import type * as schema from "@ensnode/ensnode-schema";

import { builder } from "@/graphql-api/builder";
import { DomainRef } from "@/graphql-api/schema/domain";
import { db } from "@/lib/db";

type Account = typeof schema.account.$inferSelect;

export const AccountRef = builder.objectRef<Account>("Account");

AccountRef.implement({
  description: "TODO",
  fields: (t) => ({
    //////////////////////
    // Account.address
    //////////////////////
    address: t.expose("address", {
      type: "Address",
      description: "TODO",
      nullable: false,
    }),

    //////////////////////
    // Account.domains
    //////////////////////
    domains: t.field({
      type: [DomainRef],
      description: "TODO",
      resolve: ({ address }) =>
        db.query.domain.findMany({
          where: (t, { eq }) => eq(t.ownerId, address),
        }),
    }),
  }),
});
