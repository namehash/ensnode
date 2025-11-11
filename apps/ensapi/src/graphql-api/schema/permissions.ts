import type { PermissionsId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-id";
import { AccountIdRef } from "@/graphql-api/schema/account-id";
import { db } from "@/lib/db";

export const PermissionsRef = builder.loadableObjectRef("Permissions", {
  load: (ids: PermissionsId[]) =>
    db.query.permissions.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
    }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type Permissions = Exclude<typeof PermissionsRef.$inferType, PermissionsId>;

PermissionsRef.implement({
  description: "Permissions",
  fields: (t) => ({
    contract: t.field({
      type: AccountIdRef,
      description: "TODO",
      nullable: false,
      resolve: ({ chainId, address }) => ({ chainId, address }),
    }),

    // resources...
  }),
});
