import DataLoader from "dataloader";
import { getUnixTime } from "date-fns";
import { inArray } from "drizzle-orm";
import type { DomainId, RegistryId } from "enssdk";

import di from "@/di";

const createRegistryParentDomainLoader = () =>
  new DataLoader<RegistryId, DomainId | null>(async (registryIds) => {
    const { ensDb, ensIndexerSchema } = di.context;
    const rows = await ensDb
      .select({
        id: ensIndexerSchema.registry.id,
        canonicalDomainId: ensIndexerSchema.registry.canonicalDomainId,
      })
      .from(ensIndexerSchema.registry)
      .where(inArray(ensIndexerSchema.registry.id, registryIds as RegistryId[]));
    const byId = new Map(rows.map((r) => [r.id, r.canonicalDomainId ?? null]));
    return registryIds.map((id) => byId.get(id) ?? null);
  });

/**
 * Constructs a new GraphQL Context per-request.
 *
 * @dev make sure that anything that is per-request (like dataloaders) are newly created in this fn
 */
export const context = () => ({
  now: BigInt(getUnixTime(new Date())),
  loaders: {
    registryParentDomain: createRegistryParentDomainLoader(),
  },
});
