import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { type Address, isAddressEqual, zeroAddress } from "viem";

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

export default function () {
  ponder.on(
    namespaceContract(PluginName.ENSv2, "EnhancedAccessControl:EACRolesChanged"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        resource: bigint;
        account: Address;
        oldRoleBitmap: bigint;
        newRoleBitmap: bigint;
      }>;
    }) => {
      // biome-ignore lint/correctness/noUnusedVariables: TODO: use oldRoleBitmap at all?
      const { resource, account: user, oldRoleBitmap, newRoleBitmap } = event.args;

      // Invariant: EAC reverts EACInvalidAccount if account === zeroAddress
      if (isAddressEqual(zeroAddress, user)) {
        throw new Error(
          `Invariant(EnhancedAccessControl:EACRolesChanged): EACRolesChanged emitted for zeroAddress, should have reverted.`,
        );
      }

      const contract = getThisAccountId(context, event);
      const permissionsUserId = makePermissionsUserId(contract, resource, user);

      await ensureAccount(context, user);
      await ensurePermissionsResource(context, contract, resource);

      const roles = newRoleBitmap;
      if (isZeroRoles(roles)) {
        // ensure deleted
        await context.db.delete(schema.permissionsUser, { id: permissionsUserId });
      } else {
        // ensure upserted
        await context.db
          .insert(schema.permissionsUser)
          .values({ id: permissionsUserId, ...contract, resource, user, roles })
          .onConflictDoUpdate({ roles });
      }
    },
  );
}
