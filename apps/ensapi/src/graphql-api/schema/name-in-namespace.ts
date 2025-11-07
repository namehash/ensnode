import type * as schema from "@ensnode/ensnode-schema";

import { builder } from "@/graphql-api/builder";
import { DomainRef } from "@/graphql-api/schema/domain";
import { db } from "@/lib/db";

type NameInNamespace = typeof schema.nameInNamespace.$inferSelect;

export const NameInNamespaceRef = builder.objectRef<NameInNamespace>("NameInNamespace");

NameInNamespaceRef.implement({
  description: "An ENS Name in the indexed namespace.",
  fields: (t) => ({
    //////////////////////
    // NameInNamespace.node
    //////////////////////
    node: t.expose("node", {
      type: "Node",
      description: "TODO",
      nullable: false,
    }),

    //////////////////////
    // NameInNamespace.fqdn
    //////////////////////
    fqdn: t.expose("fqdn", {
      type: "Name",
      description: "TODO",
      nullable: false,
    }),

    //////////////////////
    // NameInNamespace.domain
    //////////////////////
    domain: t.field({
      type: DomainRef,
      description: "TODO",
      nullable: false,
      resolve: async ({ domainRegistryId, domainCanonicalId }) => {
        // TODO(dataloader): just return id
        const domain = await db.query.domain.findFirst({
          where: (t, { eq, and }) =>
            and(
              eq(t.registryId, domainRegistryId), //
              eq(t.canonicalId, domainCanonicalId),
            ),
        });
        if (!domain) throw new Error(`Invariant: domain expected`);
        return domain;
      },
    }),
  }),
});

export const NameOrNodeInput = builder.inputType("NameOrNodeInput", {
  description: "TODO",
  isOneOf: true,
  fields: (t) => ({
    name: t.field({ type: "Name", required: false }),
    node: t.field({ type: "Node", required: false }),
  }),
});
