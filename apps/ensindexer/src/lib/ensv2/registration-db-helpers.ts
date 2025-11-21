import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import { type DomainId, makeLatestRegistrationId, makeRegistrationId } from "@ensnode/ensnode-sdk";

import { toJson } from "@/lib/json-stringify-with-bigints";

/**
 * TODO: find the most recent registration, active or otherwise
 */
export async function getLatestRegistration(context: Context, domainId: DomainId) {
  return context.db.find(schema.registration, { id: makeLatestRegistrationId(domainId) });
}

/**
 * TODO
 */
export async function supercedeLatestRegistration(
  context: Context,
  registration: typeof schema.registration.$inferSelect,
) {
  // Invariant: Must be the latest Registration
  if (registration.id !== makeLatestRegistrationId(registration.domainId)) {
    throw new Error(
      `Invariant(supercedeRegistration): Attempted to supercede non-latest Registration:\n${toJson(registration)}`,
    );
  }

  // delete latest
  await context.db.delete(schema.registration, { id: registration.id });

  // insert existing data into new Registration w/ indexed id
  await context.db.insert(schema.registration).values({
    ...registration,
    id: makeRegistrationId(registration.domainId, registration.index),
  });
}

/**
 * Returns whether Registration is expired. If the Registration includes a Grace Period, the
 * Grace Period window is considered expired.
 */
export function isRegistrationExpired(
  registration: typeof schema.registration.$inferSelect,
  now: bigint,
) {
  // no expiry, never expired
  if (registration.expiry === null) return false;

  // otherwise check against now
  return registration.expiry <= now;
}

/**
 * Returns whether Registration is fully expired. If the Registration includes a Grace Period, the
 * Grace Period window is considered NOT fully-expired.
 */
export function isRegistrationFullyExpired(
  registration: typeof schema.registration.$inferSelect,
  now: bigint,
) {
  // no expiry, never expired
  if (registration.expiry === null) return false;

  // otherwise it is expired if now >= expiry + grace
  return now >= registration.expiry + (registration.gracePeriod ?? 0n);
}

/**
 * Returns whether Registration is in grace period.
 */
export function isRegistrationInGracePeriod(
  registration: typeof schema.registration.$inferSelect,
  now: bigint,
) {
  if (registration.expiry === null) return false;
  if (registration.gracePeriod === null) return false;

  //
  return registration.expiry <= now && registration.expiry + registration.gracePeriod > now;
}
