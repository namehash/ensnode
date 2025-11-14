import type { Context } from "ponder:registry";
import type schema from "ponder:schema";

import type { DomainId } from "@ensnode/ensnode-sdk";

/**
 * TODO: find the most recent registration, active or otherwise
 */
export async function getLatestRegistration(context: Context, domainId: DomainId) {
  return await context.db.sql.query.registration.findFirst({
    where: (t, { eq }) => eq(t.domainId, domainId),
    orderBy: (t, { desc }) => desc(t.index),
  });
}

/**
 * Returns whether Registration is expired.
 *
 * @dev Grace Period is considered 'expired'.
 */
export function isRegistrationExpired(
  registration: typeof schema.registration.$inferSelect,
  now: bigint,
) {
  // no expiration, never expired
  if (registration.expiration === null) return false;

  // otherwise check against now
  return registration.expiration <= now;
}

/**
 * Returns whether Registration is fully expired.
 * @dev Grace Period is considered 'unexpired'.
 */
export function isRegistrationFullyExpired(
  registration: typeof schema.registration.$inferSelect,
  now: bigint,
) {
  // no expiration, never expired
  if (registration.expiration === null) return false;

  // otherwise check against now
  return registration.expiration + (registration.gracePeriod ?? 0n) <= now;
}

/**
 * Returns whether Registration is in grace period.
 */
export function isRegistrationInGracePeriod(
  registration: typeof schema.registration.$inferSelect,
  now: bigint,
) {
  if (registration.expiration === null) return false;
  if (registration.gracePeriod === null) return false;

  //
  return registration.expiration <= now && registration.expiration + registration.gracePeriod > now;
}
