import { and, eq } from "drizzle-orm";

import * as schema from "@ensnode/ensnode-schema";

import { builder } from "@/graphql-api/builder";
import { DomainRef } from "@/graphql-api/schema/domain";
import { NameInNamespaceRef } from "@/graphql-api/schema/name-in-namespace";
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

    //////////////////////
    // Account.names
    //////////////////////
    names: t.field({
      type: [NameInNamespaceRef],
      description: "TODO",
      resolve: async ({ address }) => {
        const result = await db
          .select()
          .from(schema.nameInNamespace)
          .innerJoin(
            schema.domain,
            and(
              eq(schema.nameInNamespace.domainRegistryId, schema.domain.registryId),
              eq(schema.nameInNamespace.domainCanonicalId, schema.domain.canonicalId),
            ),
          )
          .where(eq(schema.domain.ownerId, address));

        return result.map((row) => row.names_in_namespace);
      },
    }),
  }),
});
