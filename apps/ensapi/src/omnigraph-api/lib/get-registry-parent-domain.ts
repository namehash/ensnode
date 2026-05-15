import type { DomainId, RegistryId } from "enssdk";

import { ensDb } from "@/lib/ensdb/singleton";

/**
 * Returns the Registry's parent DomainId, if known.
 *
 * TODO: this lookup is unbatched and runs once per Domain whose `parent` is selected. Resolving
 * `parent` on a large list of Domains incurs N+1 round-trips. Reintroduce a DataLoader over
 * `registryId` to batch these into a single fetch per GraphQL execution.
 */
export async function getRegistryParentDomain(registryId: RegistryId): Promise<DomainId | null> {
  const registry = await ensDb.query.registry.findFirst({
    where: (t, { eq }) => eq(t.id, registryId),
    columns: { canonicalDomainId: true },
  });
  return registry?.canonicalDomainId ?? null;
}
