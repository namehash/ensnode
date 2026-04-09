import {
  type Address,
  type EACResource,
  type EACRoleBitmap,
  makePermissionsId,
  makePermissionsResourceId,
  makePermissionsUserId,
} from "enssdk";
import { isAddressEqual, zeroAddress } from "viem";

import { PluginName } from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";
import { ensurePermissionsEvent } from "@/lib/ensv2/event-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
import {
  addOnchainEventListener,
  ensIndexerSchema,
  type IndexingEngineContext,
} from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";

/**
 * Infer the type of the Permission entity's composite key.
 */
type PermissionsCompositeKey = Pick<
  typeof ensIndexerSchema.permissions.$inferInsert,
  "chainId" | "address"
>;

const ensurePermissionsResource = async (
  context: IndexingEngineContext,
  contract: PermissionsCompositeKey,
  resource: EACResource,
) => {
  const permissionsId = makePermissionsId(contract);
  const permissionsResourceId = makePermissionsResourceId(contract, resource);

  // ensure permissions
  await context.ensDb
    .insert(ensIndexerSchema.permissions)
    .values({ id: permissionsId, ...contract })
    .onConflictDoNothing();

  // ensure permissions resource
  await context.ensDb
    .insert(ensIndexerSchema.permissionsResource)
    .values({ id: permissionsResourceId, ...contract, resource })
    .onConflictDoNothing();
};

const isZeroRoles = (roles: EACRoleBitmap) => roles === 0n;

export default function () {
  addOnchainEventListener(
    namespaceContract(PluginName.ENSv2, "EnhancedAccessControl:EACRolesChanged"),
    async ({
      context,
      event,
    }: {
      context: IndexingEngineContext;
      event: EventWithArgs<{
        resource: EACResource;
        account: Address;
        oldRoleBitmap: EACRoleBitmap;
        newRoleBitmap: EACRoleBitmap;
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
        await context.ensDb.delete(ensIndexerSchema.permissionsUser, { id: permissionsUserId });
      } else {
        // ensure upserted
        await context.ensDb
          .insert(ensIndexerSchema.permissionsUser)
          .values({ id: permissionsUserId, ...contract, resource, user, roles })
          .onConflictDoUpdate({ roles });
      }

      // push event to permissions
      await ensurePermissionsEvent(context, event, contract);
    },
  );
}
