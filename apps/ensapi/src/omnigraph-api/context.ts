import DataLoader from "dataloader";
import { getUnixTime } from "date-fns";
import { inArray } from "drizzle-orm";
import type { CanonicalPath, DomainId, RegistryId } from "enssdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";

import { getCanonicalPath } from "./lib/get-canonical-path";

/**
 * A Promise.catch handler that provides the thrown error as a resolved value, useful for Dataloaders.
 */
const errorAsValue = (error: unknown) =>
  error instanceof Error ? error : new Error(String(error));

const createCanonicalPathLoader = () =>
  new DataLoader<DomainId, CanonicalPath | Error | null>(async (domainIds) =>
    Promise.all(domainIds.map((id) => getCanonicalPath(id).catch(errorAsValue))),
  );

const createRegistryParentDomainLoader = () =>
  new DataLoader<RegistryId, DomainId | null>(async (registryIds) => {
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
    canonicalPath: createCanonicalPathLoader(),
    registryParentDomain: createRegistryParentDomainLoader(),
  },
});
