import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import {
  type AccountId,
  formatAccountId,
  type Node,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";

/**
 * Get RegistrationLifecycle by node value.
 */
export async function getRegistrationLifecycle(
  context: Context,
  { node }: { node: Node },
): Promise<typeof schema.registrationLifecycles.$inferSelect | null> {
  return context.db.find(schema.registrationLifecycles, { node });
}

/**
 * Insert Registration Lifecycle
 *
 * Inserts a new record to track the current state of
 * the Registration Lifecycle by node value.
 */
export async function insertRegistrationLifecycle(
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
): Promise<void> {
  await context.db.insert(schema.registrationLifecycles).values({
    subregistryId: formatAccountId(subregistryId),
    node,
    expiresAt: BigInt(expiresAt),
  });
}

/**
 * Upsert Registration Lifecycle
 *
 * Updates the current state of the Registration Lifecycle by node value.
 */
export async function updateRegistrationLifecycle(
  context: Context,
  {
    node,
    expiresAt,
  }: {
    node: Node;
    expiresAt: UnixTimestamp;
  },
): Promise<void> {
  await context.db
    .update(schema.registrationLifecycles, { node })
    .set({ expiresAt: BigInt(expiresAt) });
}
