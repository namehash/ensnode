import type { DomainId } from "@ensnode/ensnode-sdk";

import { ensDb } from "@/lib/ensdb/singleton";

/**
 * Gets the latest Registration entity for Domain `domainId`.
 */
export async function getLatestRegistration(domainId: DomainId) {
  return await ensDb.query.registration.findFirst({
    where: (t, { eq }) => eq(t.domainId, domainId),
    orderBy: (t, { desc }) => desc(t.index),
  });
}
