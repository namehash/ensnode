import { makeResolverId } from "@ensnode/ensnode-sdk";

import type { ensIndexerSchema } from "@/lib/ensdb/singleton";
import { builder } from "@/omnigraph-api/builder";
import { AccountRef } from "@/omnigraph-api/schema/account";
import { ResolverRef } from "@/omnigraph-api/schema/resolver";

/**
 * Represents a PermissionsUser whose contract is a Resolver, providing a semantic `resolver` field.
 */
export const ResolverPermissionsUserRef =
  builder.objectRef<typeof ensIndexerSchema.permissionsUser.$inferSelect>(
    "ResolverPermissionsUser",
  );

ResolverPermissionsUserRef.implement({
  fields: (t) => ({
    //////////////////////////////////
    // ResolverPermissionsUser.id
    //////////////////////////////////
    id: t.field({
      description: "A unique reference to this ResolverPermissionsUser.",
      type: "PermissionsUserId",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ///////////////////////////////////////
    // ResolverPermissionsUser.resolver
    ///////////////////////////////////////
    resolver: t.field({
      description: "The Resolver in which this Permission is granted.",
      type: ResolverRef,
      nullable: false,
      resolve: ({ chainId, address }) => makeResolverId({ chainId, address }),
    }),

    ///////////////////////////////////////
    // ResolverPermissionsUser.resource
    ///////////////////////////////////////
    resource: t.field({
      description: "The Resource for which this Permission is granted.",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.resource,
    }),

    //////////////////////////////////
    // ResolverPermissionsUser.user
    //////////////////////////////////
    user: t.field({
      description: "The User for whom these Roles are granted.",
      type: AccountRef,
      nullable: false,
      resolve: (parent) => parent.user,
    }),

    ////////////////////////////////////
    // ResolverPermissionsUser.roles
    ////////////////////////////////////
    roles: t.field({
      description: "The Roles that this Permission grants.",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.roles,
    }),
  }),
});
