import config from "@/config";

import type { RegistryId } from "enssdk";

import { getRootRegistryId } from "@ensnode/ensnode-sdk";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Idempotently insert a Registry row, seeding `canonical = true` only if it is the namespace's
 * primary Root Registry. All other Registries become canonical via ParentUpdated or Bridged
 * Resolver attach.
 */
export async function ensureRegistry(
  context: IndexingEngineContext,
  id: RegistryId,
  args: Pick<
    typeof ensIndexerSchema.registry.$inferInsert,
    "type" | "chainId" | "address" | "node"
  >,
) {
  await context.ensDb
    .insert(ensIndexerSchema.registry)
    .values({
      id,
      ...args,
      canonical: id === getRootRegistryId(config.namespace),
    })
    .onConflictDoNothing();
}
