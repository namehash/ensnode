import { interpretedLabelsToInterpretedName } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import type { Domain } from "@/graphql-api/lib/db-types";
import { getCanonicalPath } from "@/graphql-api/lib/get-canonical-path";
import { sortByArrayOrder } from "@/graphql-api/lib/sort-by-array-order";
import { AccountRef } from "@/graphql-api/schema/account";
import { RegistryInterfaceRef } from "@/graphql-api/schema/registry";
import { db } from "@/lib/db";

export const DomainRef = builder.objectRef<Domain>("Domain");

DomainRef.implement({
  description: "a Domain",
  fields: (t) => ({
    //////////////////////
    // Domain.id
    //////////////////////
    id: t.expose("id", {
      type: "ID",
      description: "TODO",
      nullable: false,
    }),

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
        const label = await db.query.label.findFirst({
          where: (t, { eq }) => eq(t.labelHash, labelHash),
        });

        if (!label) throw new Error(`Invariant: label expected`);
        return label.value;
      },
    }),

    ////////////////////
    // Domain.canonical
    ////////////////////
    canonical: t.field({
      description: "TODO",
      type: "Name",
      nullable: true,
      resolve: async ({ id }) => {
        // TODO: dataloader the getCanonicalPath(domainId) function
        const canonicalPath = await getCanonicalPath(id);
        if (!canonicalPath) return null;

        // TODO: use the dataloaded version of this findMany w/ labels
        const domainsAndLabels = await db.query.domain.findMany({
          where: (t, { inArray }) => inArray(t.id, canonicalPath),
          with: { label: true },
        });

        return interpretedLabelsToInterpretedName(
          canonicalPath.map((domainId) => {
            const found = domainsAndLabels.find((d) => d.id === domainId);
            if (!found) throw new Error(`Invariant`);
            return found.label.value;
          }),
        );
      },
    }),

    //////////////////
    // Domain.parents
    //////////////////
    parents: t.field({
      description: "TODO",
      type: [DomainRef],
      nullable: true,
      resolve: async ({ id }) => {
        // TODO: dataloader the getCanonicalPath(domainId) function
        const canonicalPath = await getCanonicalPath(id);
        if (!canonicalPath) return null;

        const domains = await db.query.domain.findMany({
          where: (t, { inArray }) => inArray(t.id, canonicalPath),
        });

        return domains.sort(sortByArrayOrder(canonicalPath, (domain) => domain.id)).slice(1);
      },
    }),

    //////////////////
    // Domain.aliases
    //////////////////
    aliases: t.field({
      description: "TODO",
      type: ["Name"],
      nullable: false,
      resolve: async ({ registryId, canonicalId }) => {
        // a domain's aliases are all of the paths from root to this domain for which it can be
        // resolved. naively reverse-traverse the namegaph until the root is reached... yikes.
        // if materializing namespace: simply lookup namesInNamespace by domainId
        return [];
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
      type: RegistryInterfaceRef,
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
      type: RegistryInterfaceRef,
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

export const DomainIdInput = builder.inputType("DomainIdInput", {
  description: "TODO",
  isOneOf: true,
  fields: (t) => ({
    name: t.field({ type: "Name" }),
    id: t.field({ type: "DomainId" }),
  }),
});
