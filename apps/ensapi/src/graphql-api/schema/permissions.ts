import type * as schema from "@ensnode/ensnode-schema";

import { builder } from "@/graphql-api/builder";
import { AccountIdRef } from "@/graphql-api/schema/account-id";

type Permissions = typeof schema.permissions.$inferSelect;

export const PermissionsRef = builder.objectRef<Permissions>("Permissions");
PermissionsRef.implement({
  description: "Permissions",
  fields: (t) => ({
    contract: t.field({
      type: AccountIdRef,
      description: "TODO",
      nullable: false,
      resolve: ({ chainId, address }) => ({ chainId, address }),
    }),
  }),
});
