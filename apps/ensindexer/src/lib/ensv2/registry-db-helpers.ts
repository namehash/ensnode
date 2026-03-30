import { type AccountId, makeRegistryId } from "@ensnode/ensnode-sdk";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

export async function ensureRegistry(context: IndexingEngineContext, registry: AccountId) {
  const registryId = makeRegistryId(registry);

  await context.ensDb
    .insert(ensIndexerSchema.registry)
    .values({
      id: registryId,
      ...registry,
    })
    .onConflictDoNothing();

  return registryId;
}
