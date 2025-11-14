import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import { type DomainId, makeRegistrationId } from "@ensnode/ensnode-sdk";

/**
 * TODO: find the most recent registration, active or otherwise
 */
export async function getLatestRegistration(context: Context, domainId: DomainId) {
  const registrationId = makeRegistrationId(domainId, 0);
  return await context.db.find(schema.registration, { id: registrationId });
}

export function isRegistrationActive(
  registration: typeof schema.registration.$inferSelect | null,
  now: bigint,
) {
  // no registration, not active
  if (registration === null) return false;

  // no expiration, always active
  if (registration.expiration === null) return true;

  // otherwise check against now
  return registration.expiration + (registration.gracePeriod ?? 0n) < now;
}
