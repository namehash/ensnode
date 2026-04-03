import { type AccountId, type Node, stringifyAccountId } from "enssdk";

import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Get RegistrationLifecycle by node value.
 */
export async function getRegistrationLifecycle(
  context: IndexingEngineContext,
  { node }: { node: Node },
): Promise<typeof ensIndexerSchema.registrationLifecycles.$inferSelect | null> {
  return context.ensDb.find(ensIndexerSchema.registrationLifecycles, { node });
}

/**
 * Insert Registration Lifecycle
 *
 * Inserts a new record to track the current state of
 * the Registration Lifecycle by node value.
 */
export async function insertRegistrationLifecycle(
  context: IndexingEngineContext,
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
  await context.ensDb.insert(ensIndexerSchema.registrationLifecycles).values({
    subregistryId: stringifyAccountId(subregistryId),
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
  context: IndexingEngineContext,
  {
    node,
    expiresAt,
  }: {
    node: Node;
    expiresAt: UnixTimestamp;
  },
): Promise<void> {
  await context.ensDb
    .update(ensIndexerSchema.registrationLifecycles, { node })
    .set({ expiresAt: BigInt(expiresAt) });
}
