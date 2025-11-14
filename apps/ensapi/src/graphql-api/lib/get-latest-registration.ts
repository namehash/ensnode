import type { DomainId } from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

export async function getLatestRegistration(domainId: DomainId) {
  return await db.query.registration.findFirst({
    where: (t, { eq }) => eq(t.domainId, domainId),
    orderBy: (t, { desc }) => desc(t.index),
  });
}
