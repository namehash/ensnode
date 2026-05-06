import config from "@/config";

import type { RegistryId } from "enssdk";

import { getENSv1RootRegistryId, maybeGetENSv2RootRegistryId } from "@ensnode/ensnode-sdk";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Idempotently insert a Registry row, seeding `canonical = true` if it is the namespace's
 * ENSv1 or ENSv2 Root Registry.
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
      canonical:
        // by default, only the ENSv1 and ENSv2 Root Registries are Canonical
        id === getENSv1RootRegistryId(config.namespace) ||
        id === maybeGetENSv2RootRegistryId(config.namespace),
    })
    .onConflictDoNothing();
}
