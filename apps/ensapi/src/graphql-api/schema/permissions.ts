import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";

import {
  makePermissionsId,
  makePermissionsResourceId,
  type PermissionsId,
  type PermissionsResourceId,
  type PermissionsUserId,
  ROOT_RESOURCE,
} from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { AccountRef } from "@/graphql-api/schema/account";
import { AccountIdRef } from "@/graphql-api/schema/account-id";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { cursors } from "@/graphql-api/schema/cursors";
import { db } from "@/lib/db";

export const PermissionsRef = builder.loadableObjectRef("Permissions", {
  load: (ids: PermissionsId[]) =>
    db.query.permissions.findMany({ where: (t, { inArray }) => inArray(t.id, ids) }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export const PermissionsResourceRef = builder.loadableObjectRef("PermissionsResource", {
  load: (ids: PermissionsResourceId[]) =>
    db.query.permissionsResource.findMany({ where: (t, { inArray }) => inArray(t.id, ids) }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export const PermissionsUserRef = builder.loadableObjectRef("PermissionsUser", {
  load: (ids: PermissionsUserId[]) =>
    db.query.permissionsUser.findMany({ where: (t, { inArray }) => inArray(t.id, ids) }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type Permissions = Exclude<typeof PermissionsRef.$inferType, PermissionsId>;
export type PermissionsResource = Exclude<
  typeof PermissionsResourceRef.$inferType,
  PermissionsResourceId
>;
export type PermissionsUserResource = Exclude<
  typeof PermissionsUserRef.$inferType,
  PermissionsUserId
>;

///////////////
// Permissions
///////////////
PermissionsRef.implement({
  description: "Permissions",
  fields: (t) => ({
    ////////////////////////////
    // Permissions.id
    ////////////////////////////
    id: t.field({
      description: "TODO",
      type: "ID",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ////////////////////////
    // Permissions.contract
    ////////////////////////
    contract: t.field({
      description: "TODO",
      type: AccountIdRef,
      nullable: false,
      resolve: ({ chainId, address }) => ({ chainId, address }),
    }),

    ////////////////////
    // Permissions.root
    ////////////////////
    root: t.field({
      description: "TODO",
      type: PermissionsResourceRef,
      nullable: false,
      resolve: ({ chainId, address }) =>
        makePermissionsResourceId({ chainId, address }, ROOT_RESOURCE),
    }),

    /////////////////////////
    // Permissions.resources
    /////////////////////////
    resources: t.connection({
      description: "TODO",
      type: PermissionsResourceRef,
      resolve: (parent, args, context) =>
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
            db.query.permissionsResource.findMany({
              where: (t, { lt, gt, eq, and }) =>
                and(
                  ...[
                    eq(t.chainId, parent.chainId),
                    eq(t.address, parent.address),
                    before !== undefined && lt(t.id, cursors.decode<PermissionsResourceId>(before)),
                    after !== undefined && gt(t.id, cursors.decode<PermissionsResourceId>(after)),
                  ].filter((c) => !!c),
                ),
              orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
              limit,
            }),
        ),
    }),
  }),
});

///////////////////////
// PermissionsResource
///////////////////////
PermissionsResourceRef.implement({
  description: "PermissionsResource",
  fields: (t) => ({
    ////////////////////////////
    // PermissionsResource.id
    ////////////////////////////
    id: t.field({
      description: "TODO",
      type: "ID",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ///////////////////////////////////
    // PermissionsResource.permissions
    ///////////////////////////////////
    permissions: t.field({
      description: "TODO",
      type: PermissionsRef,
      nullable: false,
      resolve: ({ chainId, address }) => makePermissionsId({ chainId, address }),
    }),

    ////////////////////////////////
    // PermissionsResource.resource
    ////////////////////////////////
    resource: t.field({
      description: "TODO",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.resource,
    }),

    /////////////////////////////
    // PermissionsResource.users
    /////////////////////////////
    users: t.connection({
      description: "TODO",
      type: PermissionsUserRef,
      resolve: (parent, args, context) =>
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
            db.query.permissionsUser.findMany({
              where: (t, { lt, gt, eq, and }) =>
                and(
                  ...[
                    eq(t.chainId, parent.chainId),
                    eq(t.address, parent.address),
                    eq(t.resource, parent.resource),
                    before !== undefined && lt(t.id, cursors.decode<PermissionsUserId>(before)),
                    after !== undefined && gt(t.id, cursors.decode<PermissionsUserId>(after)),
                  ].filter((c) => !!c),
                ),
              orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
              limit,
            }),
        ),
    }),
  }),
});

///////////////////
// PermissionsUser
///////////////////
PermissionsUserRef.implement({
  description: "PermissionsUser",
  fields: (t) => ({
    ////////////////////////////
    // PermissionsUser.id
    ////////////////////////////
    id: t.field({
      description: "TODO",
      type: "ID",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ////////////////////////////
    // PermissionsUser.resource
    ////////////////////////////
    resource: t.field({
      description: "TODO",
      type: PermissionsResourceRef,
      nullable: false,
      resolve: ({ chainId, address, resource }) =>
        makePermissionsResourceId({ chainId, address }, resource),
    }),

    ////////////////////////
    // PermissionsUser.user
    ////////////////////////
    user: t.field({
      description: "TODO",
      type: AccountRef,
      nullable: false,
      resolve: (parent) => parent.user,
    }),

    /////////////////////////
    // PermissionsUser.roles
    /////////////////////////
    roles: t.field({
      description: "TODO",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.roles,
    }),
  }),
});
