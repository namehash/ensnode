import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, eq } from "drizzle-orm";

import * as schema from "@ensnode/ensnode-schema";
import {
  makePermissionsId,
  makePermissionsResourceId,
  type PermissionsId,
  type PermissionsResourceId,
  type PermissionsUserId,
  ROOT_RESOURCE,
} from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { orderPaginationBy, paginateBy } from "@/graphql-api/lib/connection-helpers";
import { resolveFindEvents } from "@/graphql-api/lib/find-events/find-events-resolver";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { lazyConnection } from "@/graphql-api/lib/lazy-connection";
import { AccountRef } from "@/graphql-api/schema/account";
import { AccountIdRef } from "@/graphql-api/schema/account-id";
import { ID_PAGINATED_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { EventRef, EventsWhereInput } from "@/graphql-api/schema/event";
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
      description: "A unique reference to this Permission.",
      type: "PermissionsId",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ////////////////////////
    // Permissions.contract
    ////////////////////////
    contract: t.field({
      description: "The contract within which these Permissions are granted.",
      type: AccountIdRef,
      nullable: false,
      resolve: ({ chainId, address }) => ({ chainId, address }),
    }),

    ////////////////////
    // Permissions.root
    ////////////////////
    root: t.field({
      description: "The Root Resource.",
      type: PermissionsResourceRef,
      nullable: false,
      resolve: ({ chainId, address }) =>
        makePermissionsResourceId({ chainId, address }, ROOT_RESOURCE),
    }),

    /////////////////////////
    // Permissions.resources
    /////////////////////////
    resources: t.connection({
      description: "All PermissionResources managed by this contract.",
      type: PermissionsResourceRef,
      resolve: (parent, args) => {
        const scope = and(
          eq(schema.permissionsResource.chainId, parent.chainId),
          eq(schema.permissionsResource.address, parent.address),
        );

        return lazyConnection({
          totalCount: () => db.$count(schema.permissionsResource, scope),
          connection: () =>
            resolveCursorConnection(
              { ...ID_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                db
                  .select()
                  .from(schema.permissionsResource)
                  .where(and(scope, paginateBy(schema.permissionsResource.id, before, after)))
                  .orderBy(orderPaginationBy(schema.permissionsResource.id, inverted))
                  .limit(limit),
            ),
        });
      },
    }),

    //////////////////////
    // Permissions.events
    //////////////////////
    events: t.connection({
      description: "All Events associated with these Permissions.",
      type: EventRef,
      args: {
        where: t.arg({ type: EventsWhereInput }),
      },
      resolve: (parent, args) =>
        resolveFindEvents(args, {
          through: {
            table: schema.permissionsEvent,
            scope: eq(schema.permissionsEvent.permissionsId, parent.id),
          },
        }),
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
      description: "A unique reference to this PermissionsResource.",
      type: "PermissionsResourceId",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ////////////////////////
    // Permissions.contract
    ////////////////////////
    contract: t.field({
      description: "The contract within which these Permissions are granted.",
      type: AccountIdRef,
      nullable: false,
      resolve: ({ chainId, address }) => ({ chainId, address }),
    }),

    ///////////////////////////////////
    // PermissionsResource.permissions
    ///////////////////////////////////
    permissions: t.field({
      description: "The Permissions within which this Resource is managed.",
      type: PermissionsRef,
      nullable: false,
      resolve: ({ chainId, address }) => makePermissionsId({ chainId, address }),
    }),

    ////////////////////////////////
    // PermissionsResource.resource
    ////////////////////////////////
    resource: t.field({
      description: "Identifies the Resource that this PermissionsResource represents.",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.resource,
    }),

    /////////////////////////////
    // PermissionsResource.users
    /////////////////////////////
    users: t.connection({
      description: "The PermissionUsers who have Roles within this Resource.",
      type: PermissionsUserRef,
      resolve: (parent, args) => {
        const scope = and(
          eq(schema.permissionsUser.chainId, parent.chainId),
          eq(schema.permissionsUser.address, parent.address),
          eq(schema.permissionsUser.resource, parent.resource),
        );

        return lazyConnection({
          totalCount: () => db.$count(schema.permissionsUser, scope),
          connection: () =>
            resolveCursorConnection(
              { ...ID_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                db
                  .select()
                  .from(schema.permissionsUser)
                  .where(and(scope, paginateBy(schema.permissionsUser.id, before, after)))
                  .orderBy(orderPaginationBy(schema.permissionsUser.id, inverted))
                  .limit(limit),
            ),
        });
      },
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
      description: "A unique reference to this PermissionsUser.",
      type: "PermissionsUserId",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ////////////////////////
    // Permissions.contract
    ////////////////////////
    contract: t.field({
      description: "The contract within which these Permissions are granted.",
      type: AccountIdRef,
      nullable: false,
      resolve: ({ chainId, address }) => ({ chainId, address }),
    }),

    ////////////////////////////
    // PermissionsUser.resource
    ////////////////////////////
    resource: t.field({
      description: "The Resource that this user has Roles within.",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.resource,
    }),

    ////////////////////////
    // PermissionsUser.user
    ////////////////////////
    user: t.field({
      description: "The User for whom these Roles are granted.",
      type: AccountRef,
      nullable: false,
      resolve: (parent) => parent.user,
    }),

    /////////////////////////
    // PermissionsUser.roles
    /////////////////////////
    roles: t.field({
      description: "The Roles this User has been granted within this Resource.",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.roles,
    }),
  }),
});
