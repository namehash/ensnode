import type * as schema from "@ensnode/ensnode-schema";

import { builder } from "@/graphql-api/builder";
import { AccountRef } from "@/graphql-api/schema/account";
import { RegistryInterface } from "@/graphql-api/schema/registry";
import { db } from "@/lib/db";

type Domain = typeof schema.domain.$inferSelect;

export const DomainRef = builder.objectRef<Domain>("Domain");

DomainRef.implement({
  description: "a Domain",
  fields: (t) => ({
    //////////////////////
    // Domain.canonicalId
    //////////////////////
    canonicalId: t.expose("canonicalId", {
      type: "BigInt",
      description: "TODO",
      nullable: false,
    }),

    //////////////////////
    // Domain.label
    //////////////////////
    label: t.field({
      type: "String",
      description: "TODO",
      nullable: false,
      resolve: async ({ labelHash }) => {
        const label = await db.query.labelInNamespace.findFirst({
          where: (t, { eq }) => eq(t.labelHash, labelHash),
        });

        if (!label) throw new Error(`Invariant: label expected`);
        return label.value;
      },
    }),

    //////////////////////
    // Domain.owner
    //////////////////////
    owner: t.field({
      type: AccountRef,
      description: "TODO",
      nullable: false,
      resolve: async ({ ownerId }) => {
        // TODO(dataloader): just id
        if (ownerId === null) throw new Error(`Invariant: ownerId null`);
        const owner = await db.query.account.findFirst({
          where: (t, { eq }) => eq(t.address, ownerId),
        });

        if (!owner) throw new Error(`Invariant: owner expected`);
        return owner;
      },
    }),

    //////////////////////
    // Domain.registry
    //////////////////////
    registry: t.field({
      type: RegistryInterface,
      description: "TODO",
      nullable: false,
      resolve: async ({ registryId }, args, ctx, info) => {
        const registry = await db.query.registry.findFirst({
          where: (t, { eq }) => eq(t.id, registryId),
        });
        if (!registry) throw new Error(`Invariant: Domain does not have parent Registry (???)`);
        return registry;
      },
    }),

    //////////////////////
    // Domain.subregistry
    //////////////////////
    subregistry: t.field({
      type: RegistryInterface,
      description: "TODO",
      resolve: async ({ subregistryId }, args, ctx, info) => {
        if (subregistryId === null) return null;

        const subregistry = await db.query.registry.findFirst({
          where: (t, { eq }) => eq(t.id, subregistryId),
        });

        return subregistry ?? null;
      },
    }),
  }),
});
