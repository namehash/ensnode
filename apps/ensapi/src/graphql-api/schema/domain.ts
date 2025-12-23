import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";

import {
  type DomainId,
  type ENSv1DomainId,
  type ENSv2DomainId,
  getCanonicalId,
  type RegistrationId,
} from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getDomainResolver } from "@/graphql-api/lib/get-domain-resolver";
import { getLatestRegistration } from "@/graphql-api/lib/get-latest-registration";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { AccountRef } from "@/graphql-api/schema/account";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { cursors } from "@/graphql-api/schema/cursors";
import { RegistrationInterfaceRef } from "@/graphql-api/schema/registration";
import { RegistryRef } from "@/graphql-api/schema/registry";
import { ResolverRef } from "@/graphql-api/schema/resolver";
import { db } from "@/lib/db";

const isENSv1Domain = (domain: Domain): domain is ENSv1Domain => "parentId" in domain;

//////////////////////
// Refs
//////////////////////

export const ENSv1DomainRef = builder.loadableObjectRef("ENSv1Domain", {
  load: (ids: ENSv1DomainId[]) =>
    db.query.v1Domain.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
      with: { label: true },
    }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export const ENSv2DomainRef = builder.loadableObjectRef("ENSv2Domain", {
  load: (ids: ENSv2DomainId[]) =>
    db.query.v2Domain.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
      with: { label: true },
    }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export const DomainInterfaceRef = builder.loadableInterfaceRef("Domain", {
  load: async (ids: DomainId[]): Promise<(ENSv1Domain | ENSv2Domain)[]> => {
    const [v1Domains, v2Domains] = await Promise.all([
      db.query.v1Domain.findMany({
        where: (t, { inArray }) => inArray(t.id, ids as any), // ignore downcast to ENSv1DomainId
        with: { label: true },
      }),
      db.query.v2Domain.findMany({
        where: (t, { inArray }) => inArray(t.id, ids as any), // ignore downcast to ENSv2DomainId
        with: { label: true },
      }),
    ]);

    return [...v1Domains, ...v2Domains];
  },
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type ENSv1Domain = Exclude<typeof ENSv1DomainRef.$inferType, ENSv1DomainId>;
export type ENSv2Domain = Exclude<typeof ENSv2DomainRef.$inferType, ENSv2DomainId>;
export type Domain = Exclude<typeof DomainInterfaceRef.$inferType, DomainId>;

//////////////////////////////////
// DomainInterface Implementation
//////////////////////////////////
DomainInterfaceRef.implement({
  description: "a Domain",
  fields: (t) => ({
    //////////////////////
    // Domain.id
    //////////////////////
    id: t.field({
      description: "TODO",
      type: "DomainId",
      nullable: false,
      resolve: (parent) => parent.id,
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
    // canonical: t.loadable({
    //   description: "TODO",
    //   type: "Name",
    //   nullable: true,
    //   load: (ids: DomainId[], context) => context.loadPosts(ids),
    //   resolve: (user, args) => user.lastPostID,
    // }),
    // canonical: t.field({
    //   description: "TODO",
    //   type: "Name",
    //   nullable: true,
    //   resolve: async ({ id }, args, context) => {
    //     // TODO: dataloader the getCanonicalPath(domainId) function
    //     const canonicalPath = await getCanonicalPath(id);
    //     if (!canonicalPath) return null;

    //     const domains = await rejectAnyErrors(
    //       DomainInterfaceRef.getDataloader(context).loadMany(canonicalPath),
    //     );

    //     return interpretedLabelsToInterpretedName(
    //       canonicalPath.map((domainId) => {
    //         const found = domains.find((d) => d.id === domainId);
    //         if (!found) throw new Error(`Invariant`);
    //         return found.label.value;
    //       }),
    //     );
    //   },
    // }),

    //////////////////
    // Domain.parents
    //////////////////
    // parents: t.field({
    //   description: "TODO",
    //   type: [DomainInterfaceRef],
    //   nullable: true,
    //   resolve: async ({ id }, args, context) => {
    //     // TODO: dataloader the getCanonicalPath(domainId) function
    //     const canonicalPath = await getCanonicalPath(id);
    //     if (!canonicalPath) return null;

    //     const domains = await rejectErrors(
    //       DomainInterfaceRef.getDataloader(context).loadMany(canonicalPath),
    //     );

    //     return domains.slice(1);
    //   },
    // }),

    //////////////////
    // Domain.aliases
    //////////////////
    // aliases: t.field({
    //   description: "TODO",
    //   type: ["Name"],
    //   nullable: false,
    //   resolve: async (parent) => {
    //     // a domain's aliases are all of the paths from root to this domain for which it can be
    //     // resolved. naively reverse-traverse the namegaph until the root is reached... yikes.
    //     return [];
    //   },
    // }),

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
    registrations: t.connection({
      description: "TODO",
      type: RegistrationInterfaceRef,
      resolve: (parent, args, context) =>
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          async ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
            db.query.registration.findMany({
              where: (t, { lt, gt, and, eq }) =>
                and(
                  ...[
                    eq(t.domainId, parent.id),
                    before !== undefined && lt(t.id, cursors.decode<RegistrationId>(before)),
                    after !== undefined && gt(t.id, cursors.decode<RegistrationId>(after)),
                  ].filter((c) => !!c),
                ),
              orderBy: (t, { asc, desc }) => (inverted ? asc(t.index) : desc(t.index)),
              limit,
            }),
        ),
    }),
  }),
});

//////////////////////////////
// ENSv1Domain Implementation
//////////////////////////////
ENSv1DomainRef.implement({
  description: "TODO",
  interfaces: [DomainInterfaceRef],
  isTypeOf: (domain) => isENSv1Domain(domain as Domain),
  fields: (t) => ({
    //////////////////////
    // ENSv1Domain.parent
    //////////////////////
    parent: t.field({
      description: "TODO",
      type: ENSv1DomainRef,
      nullable: true,
      resolve: (parent) => parent.parentId,
    }),

    ////////////////////////
    // ENSv1Domain.children
    ////////////////////////
    children: t.connection({
      description: "TODO",
      type: ENSv1DomainRef,
      resolve: (parent, args, context) =>
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
            db.query.v1Domain.findMany({
              where: (t, { lt, gt, and, eq }) =>
                and(
                  ...[
                    eq(t.parentId, parent.id),
                    before !== undefined && lt(t.id, cursors.decode<ENSv1DomainId>(before)),
                    after !== undefined && gt(t.id, cursors.decode<ENSv1DomainId>(after)),
                  ].filter((c) => !!c),
                ),
              orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
              limit,
              with: { label: true },
            }),
        ),
    }),
  }),
});

//////////////////////////////
// ENSv2Domain Implementation
//////////////////////////////
ENSv2DomainRef.implement({
  description: "TODO",
  interfaces: [DomainInterfaceRef],
  isTypeOf: (domain) => !isENSv1Domain(domain as Domain),
  fields: (t) => ({
    //////////////////////
    // Domain.canonicalId
    //////////////////////
    canonicalId: t.field({
      type: "BigInt",
      description: "TODO",
      nullable: false,
      resolve: (parent) => getCanonicalId(parent.tokenId),
    }),

    //////////////////////
    // Domain.tokenId
    //////////////////////
    tokenId: t.field({
      type: "BigInt",
      description: "TODO",
      nullable: false,
      resolve: (parent) => parent.tokenId,
    }),

    //////////////////////
    // Domain.registry
    //////////////////////
    registry: t.field({
      description: "TODO",
      type: RegistryRef,
      nullable: false,
      resolve: (parent) => parent.registryId,
    }),

    //////////////////////
    // Domain.subregistry
    //////////////////////
    subregistry: t.field({
      type: RegistryRef,
      description: "TODO",
      nullable: true,
      resolve: (parent) => parent.subregistryId,
    }),
  }),
});

//////////////////////
// Inputs
//////////////////////

export const DomainIdInput = builder.inputType("DomainIdInput", {
  description: "TODO",
  isOneOf: true,
  fields: (t) => ({
    name: t.field({ type: "Name" }),
    id: t.field({ type: "DomainId" }),
  }),
});
