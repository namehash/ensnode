import { type DomainId, makeRegistrationId, makeRenewalId } from "@ensnode/ensnode-sdk";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

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
export async function getLatestRegistration(context: IndexingEngineContext, domainId: DomainId) {
  const pointer = await context.ensDb.find(ensIndexerSchema.latestRegistrationIndex, { domainId });
  if (!pointer) return null;

  return context.ensDb.find(ensIndexerSchema.registration, {
    id: makeRegistrationId(domainId, pointer.index),
  });
}

/**
 * Inserts a Registration and updates the latestRegistration pointer for its `domainId`.
 */
export async function insertLatestRegistration(
  context: IndexingEngineContext,
  values: Omit<typeof ensIndexerSchema.registration.$inferInsert, "id" | "index">,
) {
  const { domainId } = values;

  // derive new Registration's index from previous, if exists
  const previous = await getLatestRegistration(context, domainId);
  const index = previous ? previous.index + 1 : 0;

  // insert new Registration
  await context.ensDb.insert(ensIndexerSchema.registration).values({
    id: makeRegistrationId(domainId, index),
    index,
    ...values,
  });

  // ensure this Registration is the latest
  await context.ensDb
    .insert(ensIndexerSchema.latestRegistrationIndex)
    .values({ domainId, index })
    .onConflictDoUpdate({ index });
}

/**
 * Gets the latest Renewal for the provided `domainId` and `registrationIndex`.
 */
export async function getLatestRenewal(
  context: IndexingEngineContext,
  domainId: DomainId,
  registrationIndex: number,
) {
  const pointer = await context.ensDb.find(ensIndexerSchema.latestRenewalIndex, {
    domainId,
    registrationIndex,
  });
  if (!pointer) return null;

  return context.ensDb.find(ensIndexerSchema.renewal, {
    id: makeRenewalId(domainId, registrationIndex, pointer.index),
  });
}

/**
 * Inserts a Renewal and updates the latestRenewal pointer for its `domainId` and `registrationIndex`.
 */
export async function insertLatestRenewal(
  context: IndexingEngineContext,
  registration: Pick<typeof ensIndexerSchema.registration.$inferInsert, "index">,
  values: Omit<typeof ensIndexerSchema.renewal.$inferInsert, "id" | "registrationIndex" | "index">,
) {
  const { index: registrationIndex } = registration;
  const { domainId } = values;

  // derive new Renewal's index from previous, if exists
  const previous = await getLatestRenewal(context, domainId, registrationIndex);
  const index = previous ? previous.index + 1 : 0;

  // insert new Renewal
  await context.ensDb.insert(ensIndexerSchema.renewal).values({
    id: makeRenewalId(domainId, registrationIndex, index),
    registrationIndex,
    index,
    ...values,
  });

  // ensure this Renewal is the latest
  await context.ensDb
    .insert(ensIndexerSchema.latestRenewalIndex)
    .values({ domainId, registrationIndex, index })
    .onConflictDoUpdate({ index });
}
