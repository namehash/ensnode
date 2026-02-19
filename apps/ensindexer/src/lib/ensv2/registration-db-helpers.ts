import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import { type DomainId, makeRegistrationId, makeRenewalId } from "@ensnode/ensnode-sdk";

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
 * We use pointer tables (latestRegistrationIndex, latestRenewalIndex) to track the latest index for
 * each type of entity.
 */

/**
 * Gets the latest Registration for the provided `domainId`.
 */
export async function getLatestRegistration(context: Context, domainId: DomainId) {
  const pointer = await context.db.find(schema.latestRegistrationIndex, { domainId });
  if (!pointer) return null;

  return context.db.find(schema.registration, { id: makeRegistrationId(domainId, pointer.index) });
}

/**
 * Inserts a Registration and updates the latestRegistration pointer for its `domainId`.
 */
export async function insertLatestRegistration(
  context: Context,
  values: Omit<typeof schema.registration.$inferInsert, "id" | "index">,
) {
  const { domainId } = values;

  // derive new Registration's index from previous, if exists
  const previous = await getLatestRegistration(context, domainId);
  const index = previous ? previous.index + 1 : 0;

  // insert new Registration
  await context.db.insert(schema.registration).values({
    id: makeRegistrationId(domainId, index),
    index,
    ...values,
  });

  // ensure this Registration is the latest
  await context.db
    .insert(schema.latestRegistrationIndex)
    .values({ domainId, index })
    .onConflictDoUpdate({ index });
}

/**
 * Gets the latest Renewal for the provided `domainId` and `registrationIndex`.
 */
export async function getLatestRenewal(
  context: Context,
  domainId: DomainId,
  registrationIndex: number,
) {
  const pointer = await context.db.find(schema.latestRenewalIndex, {
    domainId,
    registrationIndex,
  });
  if (!pointer) return null;

  return context.db.find(schema.renewal, {
    id: makeRenewalId(domainId, registrationIndex, pointer.index),
  });
}

/**
 * Inserts a Renewal and updates the latestRenewal pointer for its `domainId` and `registrationIndex`.
 */
export async function insertLatestRenewal(
  context: Context,
  values: Omit<typeof schema.renewal.$inferInsert, "id" | "registrationIndex" | "index">,
) {
  const { domainId } = values;

  // get the latest Registration
  const registration = await getLatestRegistration(context, domainId);
  if (!registration) {
    throw new Error(`Invariant(insertLatestRenewal): Expected latest Registration.`);
  }

  const registrationIndex = registration.index;

  // derive new Renewal's index from previous, if exists
  const previous = await getLatestRenewal(context, domainId, registrationIndex);
  const index = previous ? previous.index + 1 : 0;

  // insert new Renewal
  await context.db.insert(schema.renewal).values({
    id: makeRenewalId(domainId, registration.index, index),
    registrationIndex,
    index,
    ...values,
  });

  // ensure this Renewal is the latest
  await context.db
    .insert(schema.latestRenewalIndex)
    .values({ domainId, registrationIndex, index })
    .onConflictDoUpdate({ index });
}
