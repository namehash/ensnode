import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";

import {
  type DomainId,
  type ENSv1DomainId,
  type ENSv2DomainId,
  getCanonicalId,
  interpretedLabelsToInterpretedName,
  type RegistrationId,
} from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getDomainResolver } from "@/graphql-api/lib/get-domain-resolver";
import { getLatestRegistration } from "@/graphql-api/lib/get-latest-registration";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { rejectAnyErrors } from "@/graphql-api/lib/reject-any-errors";
import { AccountRef } from "@/graphql-api/schema/account";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { cursors } from "@/graphql-api/schema/cursors";
import { OrderDirection } from "@/graphql-api/schema/order-direction";
import { RegistrationInterfaceRef } from "@/graphql-api/schema/registration";
import { RegistryRef } from "@/graphql-api/schema/registry";
import { ResolverRef } from "@/graphql-api/schema/resolver";
import { db } from "@/lib/db";

const isENSv1Domain = (domain: Domain): domain is ENSv1Domain => "parentId" in domain;

/////////////////////////////
// ENSv1Domain & ENSv2Domain
/////////////////////////////

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

    ///////////////
    // Domain.name
    ///////////////
    name: t.field({
      description: "TODO",
      type: "Name",
      nullable: true,
      resolve: async (domain, args, context) => {
        const canonicalPath = isENSv1Domain(domain)
          ? await context.loaders.v1CanonicalPath.load(domain.id)
          : await context.loaders.v2CanonicalPath.load(domain.id);
        if (!canonicalPath) return null;

        // TODO: this could be more efficient if the get*CanonicalPath helpers included the label
        // join for us.
        const domains = await rejectAnyErrors(
          DomainInterfaceRef.getDataloader(context).loadMany(canonicalPath),
        );

        const labels = canonicalPath.map((domainId) => {
          const found = domains.find((d) => d.id === domainId);
          if (!found) {
            throw new Error(
              `Invariant(Domain.name): Domain in CanonicalPath not found:\nPath: ${JSON.stringify(canonicalPath)}\nDomainId: ${domainId}`,
            );
          }

          return found.label.value;
        });

        return interpretedLabelsToInterpretedName(labels);
      },
    }),

    // TODO: maybe supply partial names as well? perhaps a Domain.name.canonical and Domain.name.partial and so on?

    ///////////////
    // Domain.path
    ///////////////
    path: t.field({
      description: "TODO",
      type: [DomainInterfaceRef],
      nullable: true,
      resolve: async (domain, args, context) => {
        const canonicalPath = isENSv1Domain(domain)
          ? await context.loaders.v1CanonicalPath.load(domain.id)
          : await context.loaders.v2CanonicalPath.load(domain.id);
        if (!canonicalPath) return null;

        return await rejectAnyErrors(
          DomainInterfaceRef.getDataloader(context).loadMany(canonicalPath),
        );
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
                  eq(t.domainId, parent.id),
                  before ? lt(t.id, cursors.decode<RegistrationId>(before)) : undefined,
                  after ? gt(t.id, cursors.decode<RegistrationId>(after)) : undefined,
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
                  eq(t.parentId, parent.id),
                  before ? lt(t.id, cursors.decode<ENSv1DomainId>(before)) : undefined,
                  after ? gt(t.id, cursors.decode<ENSv1DomainId>(after)) : undefined,
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

export const DomainsWhereInput = builder.inputType("DomainsWhereInput", {
  description: "Filter for domains query. Requires one of name or owner.",
  fields: (t) => ({
    name: t.string(),
    owner: t.field({ type: "Address" }),
  }),
});

export const AccountDomainsWhereInput = builder.inputType("AccountDomainsWhereInput", {
  description: "Filter for Account.domains query.",
  fields: (t) => ({
    name: t.string({ required: true }),
  }),
});

//////////////////////
// Ordering
//////////////////////

export const DomainsOrderBy = builder.enumType("DomainsOrderBy", {
  description: "Fields by which domains can be ordered",
  values: ["NAME", "REGISTRATION_TIMESTAMP", "REGISTRATION_EXPIRY"] as const,
});

export type DomainsOrderByValue = typeof DomainsOrderBy.$inferType;

export const DomainsOrderInput = builder.inputType("DomainsOrderInput", {
  description: "Ordering options for domains query",
  fields: (t) => ({
    by: t.field({ type: DomainsOrderBy, required: true }),
    dir: t.field({ type: OrderDirection, defaultValue: "ASC" }),
  }),
});
