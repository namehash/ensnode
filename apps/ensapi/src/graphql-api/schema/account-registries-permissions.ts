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
      description: "TODO",
      type: RegistryRef,
      nullable: false,
      resolve: (parent) => parent.registry,
    }),

    ///////////////////////////////////////
    // AccountRegistryPermissions.resource
    ///////////////////////////////////////
    resource: t.field({
      description: "TODO",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.permissionsUser.resource,
    }),

    ////////////////////////////////////
    // AccountRegistryPermissions.roles
    ////////////////////////////////////
    roles: t.field({
      description: "TODO",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.permissionsUser.roles,
    }),
  }),
});
