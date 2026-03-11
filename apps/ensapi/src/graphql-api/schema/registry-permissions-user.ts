import type * as schema from "@ensnode/ensnode-schema";
import { makeRegistryId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { RegistryRef } from "@/graphql-api/schema/registry";

/**
 * Represents a PermissionsUser whose contract is a Registry, providing a semantic `registry` field.
 */
export const RegistryPermissionsUserRef =
  builder.objectRef<typeof schema.permissionsUser.$inferSelect>("RegistryPermissionsUser");

RegistryPermissionsUserRef.implement({
  fields: (t) => ({
    /////////////////////////////////////
    // RegistryPermissionsUser.registry
    /////////////////////////////////////
    registry: t.field({
      description: "The Registry in which this Permission is granted.",
      type: RegistryRef,
      nullable: false,
      resolve: ({ chainId, address }) => makeRegistryId({ chainId, address }),
    }),

    /////////////////////////////////////
    // RegistryPermissionsUser.resource
    /////////////////////////////////////
    resource: t.field({
      description: "The Resource for which this Permission is granted.",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.resource,
    }),

    //////////////////////////////////
    // RegistryPermissionsUser.roles
    //////////////////////////////////
    roles: t.field({
      description: "The Roles that this Permission grants.",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.roles,
    }),
  }),
});
