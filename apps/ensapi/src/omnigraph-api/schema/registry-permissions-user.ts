import { makeRegistryId } from "enssdk";

import type { ensIndexerSchema } from "@/lib/ensdb/singleton";
import { builder } from "@/omnigraph-api/builder";
import { AccountRef } from "@/omnigraph-api/schema/account";
import { RegistryRef } from "@/omnigraph-api/schema/registry";

/**
 * Represents a PermissionsUser whose contract is a Registry, providing a semantic `registry` field.
 */
export const RegistryPermissionsUserRef =
  builder.objectRef<typeof ensIndexerSchema.permissionsUser.$inferSelect>(
    "RegistryPermissionsUser",
  );

RegistryPermissionsUserRef.implement({
  fields: (t) => ({
    /////////////////////////////////
    // RegistryPermissionsUser.id
    /////////////////////////////////
    id: t.field({
      description: "A unique reference to this RegistryPermissionsUser.",
      type: "PermissionsUserId",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

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

    /////////////////////////////////
    // RegistryPermissionsUser.user
    /////////////////////////////////
    user: t.field({
      description: "The User for whom these Roles are granted.",
      type: AccountRef,
      nullable: false,
      resolve: (parent) => parent.user,
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
