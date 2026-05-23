import type { DomainId } from "enssdk";

import di from "@/di";

/**
 * Gets the latest Registration entity for Domain `domainId`.
 */
export async function getLatestRegistration(domainId: DomainId) {
  const { ensDb } = di.context;
  return await ensDb.query.registration.findFirst({
    where: (t, { eq }) => eq(t.domainId, domainId),
    orderBy: (t, { desc }) => desc(t.registrationIndex),
  });
}
