import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import { type DomainId, makeLatestRegistrationId, makeRegistrationId } from "@ensnode/ensnode-sdk";

import { toJson } from "@/lib/json-stringify-with-bigints";

/**
 * Latest Registration & Renewals
 *
 * We store a one-to-many relationship of Domain -> Registration and a one-to-many relationship of
 * Registration -> Renewal, but must frequently access the latest Registration or Renewal in our
 * indexing logic. If we were to access these entities via a custom sql query like "SELECT * from
 * registrations WHERE domainId= $domainId ORDER BY index DESC", ponder's in-memory cache would have
 * to be flushed to postgres every time we access the latest Registration/Renewal, which is pretty
 * frequent. To avoid this, we use the special key path /latest (instead of /:index) to access the
 * latest Registration/Renewal, turning the operation into an O(1) lookup compatible with Ponder's
 * in-memory cacheable db api.
 *
 * Then, when a new Registration/Renewal is to be created, the current latest is 'superceded': its id
 * that is currently /latest is replaced by /:index and the new /latest is inserted. To make this
 * compatible with Ponder's cacheable api, instead of updating the id, we delete the /latest entity
 * and insert a new entity (with all of the same columns) under the new id. See `supercedeLatestRegistration`
 * for implementation.
 *
 * This same logic applies to Renewals.
 */

/**
 * Gets the latest Regsitration for the provided `domainId`.
 */
export async function getLatestRegistration(context: Context, domainId: DomainId) {
  return context.db.find(schema.registration, { id: makeLatestRegistrationId(domainId) });
}

/**
 * Supercedes the latest Registration, changing its id to be indexed, making room in the set for
 * a new latest Registration.
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
