import type { DomainId, RegistryId } from "enssdk";

import { ensDb } from "@/lib/ensdb/singleton";

/**
 * Returns the Registry's parent DomainId, if known.
 */
export async function getRegistryParentDomain(registryId: RegistryId): Promise<DomainId | null> {
  const registry = await ensDb.query.registry.findFirst({
    where: (t, { eq }) => eq(t.id, registryId),
    columns: { canonicalDomainId: true },
  });
  return registry?.canonicalDomainId ?? null;
}
