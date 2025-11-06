import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import {
  type AccountId,
  type Node,
  serializeAccountId,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";

/**
 * Get RegistrationLifecycle by node value.
 */
export async function getRegistrationLifecycle(context: Context, { node }: { node: Node }) {
  return context.db.find(schema.registrationLifecycles, { node });
}

/**
 * Make first registration
 *
 * Inserts a new record to track the current state of
 * the Registration Lifecycle by node value.
 */
export async function makeFirstRegistration(
  context: Context,
  {
    subregistryId,
    node,
    expiresAt,
  }: {
    subregistryId: AccountId;
    node: Node;
    expiresAt: UnixTimestamp;
  },
) {
  return context.db.insert(schema.registrationLifecycles).values({
    subregistryId: serializeAccountId(subregistryId),
    node,
    expiresAt: BigInt(expiresAt),
  });
}

/**
 * Make subsequent registration
 *
 * Updates the current state of the Registration Lifecycle by node value.
 *
 * Note: this is a simplified approach where we override the expiry date of
 * the registration lifecycle record for the node value.
 * We took the simplified option to cut the scope. However, the ideal approach
 * would create another Registration Lifecycle record for the subsequent
 * registration, as it means the previous registration for the node went
 * through all possible {@link RegistrationLifecycleStages}.
 */
export async function makeSubsequentRegistration(
  context: Context,
  {
    node,
    expiresAt,
  }: {
    node: Node;
    expiresAt: UnixTimestamp;
  },
) {
  return context.db
    .update(schema.registrationLifecycles, { node })
    .set({ expiresAt: BigInt(expiresAt) });
}

/**
 * Extend Registration Lifecycle
 *
 * Updates the current state of the Registration Lifecycle by node value.
 */
export async function extendRegistrationLifecycle(
  context: Context,
  {
    node,
    expiresAt,
  }: {
    node: Node;
    expiresAt: UnixTimestamp;
  },
) {
  return context.db
    .update(schema.registrationLifecycles, { node })
    .set({ expiresAt: BigInt(expiresAt) });
}
