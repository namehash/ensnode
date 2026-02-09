import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";

import { type ENSv2DomainId, makePermissionsId, type RegistryId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { AccountIdInput, AccountIdRef } from "@/graphql-api/schema/account-id";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { cursors } from "@/graphql-api/schema/cursors";
import { ENSv2DomainRef } from "@/graphql-api/schema/domain";
import { PermissionsRef } from "@/graphql-api/schema/permissions";
import { db } from "@/lib/db";

export const RegistryRef = builder.loadableObjectRef("Registry", {
  load: (ids: RegistryId[]) =>
    db.query.registry.findMany({ where: (t, { inArray }) => inArray(t.id, ids) }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type Registry = Exclude<typeof RegistryRef.$inferType, RegistryId>;

RegistryRef.implement({
  description: "TODO",
  fields: (t) => ({
    //////////////////////
    // Registry.id
    //////////////////////
    id: t.field({
      description: "TODO",
      type: "RegistryId",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ////////////////////
    // Registry.parents
    ////////////////////
    parents: t.connection({
      description: "TODO",
      type: ENSv2DomainRef,
      resolve: (parent, args, context) =>
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          async ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
            db.query.v2Domain.findMany({
              where: (t, { lt, gt, and, eq }) =>
                and(
                  eq(t.subregistryId, parent.id),
                  before ? lt(t.id, cursors.decode<ENSv2DomainId>(before)) : undefined,
                  after ? gt(t.id, cursors.decode<ENSv2DomainId>(after)) : undefined,
                ),
              orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
              limit,
              with: { label: true },
            }),
        ),
    }),

    //////////////////////
    // Registry.domains
    //////////////////////
    domains: t.connection({
      description: "TODO",
      type: ENSv2DomainRef,
      resolve: (parent, args, context) =>
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
            db.query.v2Domain.findMany({
              where: (t, { lt, gt, eq, and }) =>
                and(
                  eq(t.registryId, parent.id),
                  before ? lt(t.id, cursors.decode<ENSv2DomainId>(before)) : undefined,
                  after ? gt(t.id, cursors.decode<ENSv2DomainId>(after)) : undefined,
                ),
              orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
              limit,
              with: { label: true },
            }),
        ),
    }),

    ////////////////////////
    // Registry.permissions
    ////////////////////////
    permissions: t.field({
      description: "TODO",
      type: PermissionsRef,
      // TODO: render a RegistryPermissions model that parses the backing permissions into registry-semantic roles
      resolve: ({ chainId, address }) => makePermissionsId({ chainId, address }),
    }),

    /////////////////////
    // Registry.contract
    /////////////////////
    contract: t.field({
      description: "TODO",
      type: AccountIdRef,
      nullable: false,
      resolve: ({ chainId, address }) => ({ chainId, address }),
    }),
  }),
});

//////////
// Inputs
//////////

export const RegistryIdInput = builder.inputType("RegistryIdInput", {
  description: "TODO",
  isOneOf: true,
  fields: (t) => ({
    id: t.field({ type: "RegistryId" }),
    contract: t.field({ type: AccountIdInput }),
  }),
});
