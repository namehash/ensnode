import type * as schema from "@ensnode/ensnode-schema";

import { builder } from "@/graphql-api/builder";
import { RegistryRef } from "@/graphql-api/schema/registry";

/**
 * Represents an account-specific reference to a `registry` and the account's PermissionsUser for
 * that registry.
 */
export interface AccountRegistryPermissionsRef {
  permissionsUser: typeof schema.permissionsUser.$inferSelect;
  registry: typeof schema.registry.$inferSelect;
}

export const AccountRegistryPermissionsRef = builder.objectRef<AccountRegistryPermissionsRef>(
  "AccountRegistryPermissions",
);

AccountRegistryPermissionsRef.implement({
  fields: (t) => ({
    ///////////////////////////////////////
    // AccountRegistryPermissions.registry
    ///////////////////////////////////////
    registry: t.field({
      description: "The Registry in which this Permission is granted.",
      type: RegistryRef,
      nullable: false,
      resolve: (parent) => parent.registry,
    }),

    ///////////////////////////////////////
    // AccountRegistryPermissions.resource
    ///////////////////////////////////////
    resource: t.field({
      description: "The Resource for which this Permission is granted.",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.permissionsUser.resource,
    }),

    ////////////////////////////////////
    // AccountRegistryPermissions.roles
    ////////////////////////////////////
    roles: t.field({
      description: "The Roles that this Permission grants.",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.permissionsUser.roles,
    }),
  }),
});
