import config from "@/config";

import type { RegistryId } from "enssdk";

import { isRootRegistryId } from "@ensnode/ensnode-sdk";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Idempotently insert a Registry row, seeding `canonical = true` only for the namespace's Root
 * Registries (ENSv1 root, and ENSv2 root when defined). All other Registries — including ENSv1
 * concrete and virtual registries — default to `canonical = false` and earn canonicality through
 * the natural reconcile + cascade flow in `canonicality-db-helpers.ts` once the bidirectional
 * canonical edge agrees back to a canonical parent Domain. v1 and v2 share the same canonicality
 * definition: a Registry is canonical iff it can be traced back to a Root via canonical edges.
 *
 * @returns whether the registry was created by this operation
 */
export async function ensureRegistry(
  context: IndexingEngineContext,
  id: RegistryId,
  args: Pick<
    typeof ensIndexerSchema.registry.$inferInsert,
    "type" | "chainId" | "address" | "node"
  >,
): Promise<boolean> {
  const existing = await context.ensDb.find(ensIndexerSchema.registry, { id });
  if (existing) return false;

  await context.ensDb.insert(ensIndexerSchema.registry).values({
    id,
    ...args,
    canonical: isRootRegistryId(config.namespace, id),
  });
  return true;
}
