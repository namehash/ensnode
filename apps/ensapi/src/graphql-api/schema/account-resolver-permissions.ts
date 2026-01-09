import type * as schema from "@ensnode/ensnode-schema";

import { builder } from "@/graphql-api/builder";
import { ResolverRef } from "@/graphql-api/schema/resolver";

/**
 * Represents an account-specific reference to a `resolver` and the account's PermissionsUser for
 * that resolver.
 */
export interface AccountResolverPermissions {
  permissionsUser: typeof schema.permissionsUser.$inferSelect;
  resolver: typeof schema.resolver.$inferSelect;
}

export const AccountResolverPermissionsRef = builder.objectRef<AccountResolverPermissions>(
  "AccountResolverPermissions",
);

AccountResolverPermissionsRef.implement({
  fields: (t) => ({
    ///////////////////////////////////////
    // AccountResolverPermissions.resolver
    ///////////////////////////////////////
    resolver: t.field({
      description: "TODO",
      type: ResolverRef,
      nullable: false,
      resolve: (parent) => parent.resolver,
    }),

    ///////////////////////////////////////
    // AccountResolverPermissions.resource
    ///////////////////////////////////////
    resource: t.field({
      description: "TODO",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.permissionsUser.resource,
    }),

    ////////////////////////////////////
    // AccountResolverPermissions.roles
    ////////////////////////////////////
    roles: t.field({
      description: "TODO",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.permissionsUser.roles,
    }),
  }),
});
