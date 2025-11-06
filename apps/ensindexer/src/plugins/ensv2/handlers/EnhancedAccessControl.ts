import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import { PluginName } from "@ensnode/ensnode-sdk";

import { makeAccountId } from "@/lib/make-account-id";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";

/**
 * Infer the type of the Permission entity's composite primary key.
 */
type PermissionsId = Pick<typeof schema.permissions.$inferInsert, "chainId" | "address">;

/**
 * Infer the type of the PermissionsUsers entity's composite primary key.
 */
type PermissionsUsersId = Pick<
  typeof schema.permissionsUser.$inferInsert,
  "chainId" | "address" | "resource" | "user"
>;

const ensurePermissionsResource = async (context: Context, id: PermissionsId, resource: bigint) => {
  await context.db.insert(schema.permissions).values(id).onConflictDoNothing();
  await context.db
    .insert(schema.permissionsResource)
    .values({ ...id, resource })
    .onConflictDoNothing();
};

const isZeroRoles = (roles: bigint) => roles === 0n;

async function upsertNewRoles(context: Context, id: PermissionsUsersId, roles: bigint) {
  if (isZeroRoles(roles)) {
    // ensure deleted
    await context.db.delete(schema.permissionsUser, id);
  } else {
    // ensure upserted
    await context.db
      .insert(schema.permissionsUser)
      .values({ ...id, roles })
      .onConflictDoUpdate({ roles });
  }
}

export default function () {
  ponder.on(
    namespaceContract(PluginName.ENSv2, "EnhancedAccessControl:EACRolesGranted"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        resource: bigint;
        roleBitmap: bigint;
        account: Address;
      }>;
    }) => {
      const { resource, roleBitmap: roles, account: user } = event.args;

      const accountId = makeAccountId(context, event);
      await ensurePermissionsResource(context, accountId, resource);

      const permissionsUserId: PermissionsUsersId = { ...accountId, resource, user };
      const existing = await context.db.find(schema.permissionsUser, permissionsUserId);

      // https://github.com/ensdomains/namechain/blob/main/contracts/src/common/access-control/EnhancedAccessControl.sol#L292
      const newRoles = (existing?.roles ?? 0n) | roles;
      await upsertNewRoles(context, permissionsUserId, newRoles);
    },
  );

  ponder.on(
    namespaceContract(PluginName.ENSv2, "EnhancedAccessControl:EACRolesRevoked"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        resource: bigint;
        roleBitmap: bigint;
        account: Address;
      }>;
    }) => {
      const { resource, roleBitmap: roles, account: user } = event.args;

      const accountId = makeAccountId(context, event);
      await ensurePermissionsResource(context, accountId, resource);

      const permissionsUserId: PermissionsUsersId = { ...accountId, resource, user };
      const existing = await context.db.find(schema.permissionsUser, permissionsUserId);

      // https://github.com/ensdomains/namechain/blob/main/contracts/src/common/access-control/EnhancedAccessControl.sol#L325
      const newRoles = (existing?.roles ?? 0n) & ~roles;
      await upsertNewRoles(context, permissionsUserId, newRoles);
    },
  );

  ponder.on(
    namespaceContract(PluginName.ENSv2, "EnhancedAccessControl:EACAllRolesRevoked"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        resource: bigint;
        account: Address;
      }>;
    }) => {
      const { resource, account: user } = event.args;

      const accountId = makeAccountId(context, event);
      await ensurePermissionsResource(context, accountId, resource);

      const permissionsUserId: PermissionsUsersId = { ...accountId, resource, user };

      await upsertNewRoles(context, permissionsUserId, 0n);
    },
  );
}
