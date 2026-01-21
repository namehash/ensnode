import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import {
  type DomainId,
  makeLatestRegistrationId,
  makeLatestRenewalId,
  makeRegistrationId,
  makeRenewalId,
} from "@ensnode/ensnode-sdk";

import { toJson } from "@/lib/json-stringify-with-bigints";

/**
 * Latest Registration & Renewals
 *
 * We store a one-to-many relationship of Domain -> Registration and a one-to-many relationship of
 * Registration -> Renewal, but must efficiently access the latest Registration or Renewal in our
 * indexing logic. The concrete reason for this is that information regarding the latest Registration
 * is spread across event handlers: in ENSv1, the .eth BaseRegistrar emits an event that omits pricing
 * information. This pricing information is only knowable until the RegistrarController emits an event
 * (directly afterwards) including said info. If we were to only index the RegistrarController, however,
 * we could theoretically miss Registrations or Renewals created by a RegistrarController that we don't
 * index for whatever reason.
 *
 * If we were to access these entities via a custom sql query like "SELECT * from registrations
 * WHERE domainId= $domainId ORDER BY index DESC", ponder's in-memory cache would have to be flushed
 * to postgres every time we access the latest Registration/Renewal, which is pretty frequent.
 * To avoid this, we use the special key path /latest (instead of /:index) to access the
 * latest Registration/Renewal, turning the operation into an O(1) lookup compatible with Ponder's
 * in-memory cacheable db api.
 *
 * Then, when a new Registration/Renewal is to be created, the current latest is 'superceded': its id
 * that is currently /latest is replaced by /:index and the new /latest is inserted. To make this
 * compatible with Ponder's cacheable api, instead of updating the id, we delete the /latest entity
 * and insert a new entity (with all of the same columns) under the new id. See `supercedeLatestRegistration`
 * for implementation.
 *
 * This same logic applies to Renewals. Note that the foreign key for a Renewal's Registration is NOT
 * the RegistrationId (which changes from /latest to /:index as discussed) but is
 * (domainId, registrationIndex, index). The renewals_relationships shows how the composite key
 * (domainId, registrationIndex) is used to join Registrations and Renewals.
 *
 * Finally, RenewalIds must use the 'pinned' RegistrationId (i.e. /:index) at all times, to avoid
 * uniqueness collisions when Registrations are superceded.
 */

/**
 * Gets the latest Regsitration for the provided `domainId`.
 */
export async function getLatestRegistration(context: Context, domainId: DomainId) {
  return context.db.find(schema.registration, { id: makeLatestRegistrationId(domainId) });
}

/**
 * Supercedes the latest Registration, pinning its, making room in the set for a new latest Registration.
 */
export async function supercedeLatestRegistration(
  context: Context,
  registration: typeof schema.registration.$inferSelect,
) {
  // Invariant: Must be the latest Registration
  if (registration.id !== makeLatestRegistrationId(registration.domainId)) {
    throw new Error(
      `Invariant(supercedeLatestRegistration): Attempted to supercede non-latest Registration:\n${toJson(registration)}`,
    );
  }

  // delete latest
  await context.db.delete(schema.registration, { id: registration.id });

  // insert existing data into new Registration w/ pinned RegistrationId
  await context.db.insert(schema.registration).values({
    ...registration,
    id: makeRegistrationId(registration.domainId, registration.index),
  });
}

/**
 * Gets the latest Renewal.
 */
export async function getLatestRenewal(
  context: Context,
  domainId: DomainId,
  registrationIndex: number,
) {
  return context.db.find(schema.renewal, { id: makeLatestRenewalId(domainId, registrationIndex) });
}

/**
 * Supercedes the latest Renewal, pinning its id, making room in the set for a new latest Renewal.
 */
export async function supercedeLatestRenewal(
  context: Context,
  renewal: typeof schema.renewal.$inferSelect,
) {
  // Invariant: Must be the latest Renewal
  if (renewal.id !== makeLatestRenewalId(renewal.domainId, renewal.registrationIndex)) {
    throw new Error(
      `Invariant(supercedeLatestRenewal): Attempted to supercede non-latest Renewal:\n${toJson(renewal)}`,
    );
  }

  // delete latest
  await context.db.delete(schema.renewal, { id: renewal.id });

  // insert existing data into new Renewal w/ 'pinned' RenewalId
  await context.db.insert(schema.renewal).values({
    ...renewal,
    id: makeRenewalId(renewal.domainId, renewal.registrationIndex, renewal.index),
  });
}
