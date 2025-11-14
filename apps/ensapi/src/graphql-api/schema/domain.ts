import { rejectErrors } from "@pothos/plugin-dataloader";

import {
  type DomainId,
  getCanonicalId,
  interpretedLabelsToInterpretedName,
} from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getCanonicalPath } from "@/graphql-api/lib/get-canonical-path";
import { getDomainResolver } from "@/graphql-api/lib/get-domain-resolver";
import { getModelId } from "@/graphql-api/lib/get-id";
import { getLatestRegistration } from "@/graphql-api/lib/get-latest-registration";
import { rejectAnyErrors } from "@/graphql-api/lib/reject-any-errors";
import { AccountRef } from "@/graphql-api/schema/account";
import { type Registration, RegistrationInterfaceRef } from "@/graphql-api/schema/registration";
import { RegistryInterfaceRef } from "@/graphql-api/schema/registry";
import { ResolverRef } from "@/graphql-api/schema/resolver";
import { db } from "@/lib/db";

export const DomainRef = builder.loadableObjectRef("Domain", {
  load: (ids: DomainId[]) =>
    db.query.domain.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
      with: { label: true },
    }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type Domain = Exclude<typeof DomainRef.$inferType, DomainId>;

// we want to dataloader labels by labelhash
// we want to dataloader a domain's canonical path, but without exposing it
// TODO: consider interface with ... on ENSv2Domain { canonicalId } etc
// ... on ENSv1Domain { node } etc

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
    canonicalId: t.field({
      type: "BigInt",
      description: "TODO",
      nullable: false,
      resolve: (parent) => getCanonicalId(parent.labelHash),
    }),

    //////////////////////
    // Domain.label
    //////////////////////
    label: t.field({
      type: "String",
      description: "TODO",
      nullable: false,
      resolve: async ({ label }) => label.value,
    }),

    ////////////////////
    // Domain.canonical
    ////////////////////
    canonical: t.field({
      description: "TODO",
      type: "Name",
      nullable: true,
      resolve: async ({ id }, args, context) => {
        // TODO: dataloader the getCanonicalPath(domainId) function
        const canonicalPath = await getCanonicalPath(id);
        if (!canonicalPath) return null;

        const domains = await rejectAnyErrors(
          DomainRef.getDataloader(context).loadMany(canonicalPath),
        );

        return interpretedLabelsToInterpretedName(
          canonicalPath.map((domainId) => {
            const found = domains.find((d) => d.id === domainId);
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
      resolve: async ({ id }, args, context) => {
        // TODO: dataloader the getCanonicalPath(domainId) function
        const canonicalPath = await getCanonicalPath(id);
        if (!canonicalPath) return null;

        const domains = await rejectErrors(
          DomainRef.getDataloader(context).loadMany(canonicalPath),
        );

        return domains.slice(1);
      },
    }),

    //////////////////
    // Domain.aliases
    //////////////////
    aliases: t.field({
      description: "TODO",
      type: ["Name"],
      nullable: false,
      resolve: async (parent) => {
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
      nullable: true,
      resolve: (parent) => parent.ownerId,
    }),

    //////////////////////
    // Domain.registry
    //////////////////////
    registry: t.field({
      description: "TODO",
      type: RegistryInterfaceRef,
      nullable: false,
      resolve: (parent) => parent.registryId,
    }),

    //////////////////////
    // Domain.subregistry
    //////////////////////
    subregistry: t.field({
      type: RegistryInterfaceRef,
      description: "TODO",
      nullable: true,
      resolve: (parent) => parent.subregistryId,
    }),

    //////////////////////
    // Domain.resolver
    //////////////////////
    resolver: t.field({
      description: "TODO",
      type: ResolverRef,
      nullable: true,
      resolve: (parent) => getDomainResolver(parent.id),
    }),

    ///////////////////////
    // Domain.registration
    ///////////////////////
    registration: t.field({
      description: "TODO",
      type: RegistrationInterfaceRef,
      nullable: true,
      resolve: (parent) => getLatestRegistration(parent.id),
    }),

    ////////////////////////
    // Domain.registrations
    ////////////////////////
    registrations: t.loadableGroup({
      description: "TODO",
      type: RegistrationInterfaceRef,
      load: (ids: DomainId[]) =>
        db.query.registration.findMany({
          where: (t, { inArray }) => inArray(t.domainId, ids),
          orderBy: (t, { desc }) => desc(t.index),
        }),
      group: (registration) => (registration as Registration).domainId,
      resolve: getModelId,
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
