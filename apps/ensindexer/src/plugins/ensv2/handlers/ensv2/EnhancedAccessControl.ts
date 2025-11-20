import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import {
  makePermissionsId,
  makePermissionsResourceId,
  makePermissionsUserId,
  PluginName,
} from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";

/**
 * Infer the type of the Permission entity's composite key.
 */
type PermissionsCompositeKey = Pick<typeof schema.permissions.$inferInsert, "chainId" | "address">;

/**
 * Infer the type of the PermissionsUsers entity's composite key.
 */
type PermissionsUsersCompositeKey = Pick<
  typeof schema.permissionsUser.$inferInsert,
  "chainId" | "address" | "resource" | "user"
>;

const ensurePermissionsResource = async (
  context: Context,
  contract: PermissionsCompositeKey,
  resource: bigint,
) => {
  const permissionsId = makePermissionsId(contract);
  const permissionsResourceId = makePermissionsResourceId(contract, resource);

  // ensure permissions
  await context.db
    .insert(schema.permissions)
    .values({ id: permissionsId, ...contract })
    .onConflictDoNothing();

  // ensure permissions resource
  await context.db
    .insert(schema.permissionsResource)
    .values({ id: permissionsResourceId, ...contract, resource })
    .onConflictDoNothing();
};

const isZeroRoles = (roles: bigint) => roles === 0n;

async function upsertNewRoles(context: Context, key: PermissionsUsersCompositeKey, roles: bigint) {
  const permissionsUserId = makePermissionsUserId(
    { chainId: key.chainId, address: key.address },
    key.resource,
    key.user,
  );

  if (isZeroRoles(roles)) {
    // ensure deleted
    await context.db.delete(schema.permissionsUser, { id: permissionsUserId });
  } else {
    // ensure upserted
    await context.db
      .insert(schema.permissionsUser)
      .values({ id: permissionsUserId, ...key, roles })
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

      await ensureAccount(context, user);

      const accountId = getThisAccountId(context, event);
      const permissionsUserId = makePermissionsUserId(accountId, resource, user);

      await ensurePermissionsResource(context, accountId, resource);
      const existing = await context.db.find(schema.permissionsUser, { id: permissionsUserId });

      // https://github.com/ensdomains/namechain/blob/main/contracts/src/common/access-control/EnhancedAccessControl.sol#L292
      const newRoles = (existing?.roles ?? 0n) | roles;
      await upsertNewRoles(context, { ...accountId, resource, user }, newRoles);
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

      await ensureAccount(context, user);

      const accountId = getThisAccountId(context, event);
      const permissionsUserId = makePermissionsUserId(accountId, resource, user);

      await ensurePermissionsResource(context, accountId, resource);
      const existing = await context.db.find(schema.permissionsUser, { id: permissionsUserId });

      // https://github.com/ensdomains/namechain/blob/main/contracts/src/common/access-control/EnhancedAccessControl.sol#L325
      const newRoles = (existing?.roles ?? 0n) & ~roles;
      await upsertNewRoles(context, { ...accountId, resource, user }, newRoles);
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

      await ensureAccount(context, user);

      const accountId = getThisAccountId(context, event);
      await ensurePermissionsResource(context, accountId, resource);

      await upsertNewRoles(context, { ...accountId, resource, user }, 0n);
    },
  );
}
