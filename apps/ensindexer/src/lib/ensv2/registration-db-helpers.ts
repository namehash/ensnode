import { type DomainId, makeRegistrationId, makeRenewalId } from "enssdk";

import { REGISTRATION_SORT_SENTINEL } from "@ensnode/ensdb-sdk/ensindexer-abstract";

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
 * Materializes the latest Registration's sort keys onto the Domain row, if it exists.
 *
 * Preminted names (BaseRegistrar `registerOnly` on Basenames/Lineanames) have a Registration before
 * their Domain row exists, and Ponder's `update` throws on an absent row. Such a Domain materializes
 * these columns from its latest Registration when it's created (see ENSv1Registry NewOwner).
 */
async function materializeDomainLatestRegistration(
  context: IndexingEngineContext,
  domainId: DomainId,
  values: Partial<
    Pick<
      typeof ensIndexerSchema.domain.$inferInsert,
      "__latestRegistrationStart" | "__latestRegistrationExpiry"
    >
  >,
) {
  const domain = await context.ensDb.find(ensIndexerSchema.domain, { id: domainId });
  if (!domain) return;
  await context.ensDb.update(ensIndexerSchema.domain, { id: domainId }).set(values);
}

/**
 * Gets the latest Registration for the provided `domainId`.
 */
export async function getLatestRegistration(context: IndexingEngineContext, domainId: DomainId) {
  const pointer = await context.ensDb.find(ensIndexerSchema.latestRegistrationIndex, { domainId });
  if (!pointer) return null;

  return context.ensDb.find(ensIndexerSchema.registration, {
    id: makeRegistrationId(domainId, pointer.registrationIndex),
  });
}

/**
 * Inserts a Registration and updates the latestRegistration pointer for its `domainId`.
 */
export async function insertLatestRegistration(
  context: IndexingEngineContext,
  values: Omit<typeof ensIndexerSchema.registration.$inferInsert, "id" | "registrationIndex">,
) {
  const { domainId } = values;

  // derive new Registration's index from previous, if exists
  const previous = await getLatestRegistration(context, domainId);
  const registrationIndex = previous ? previous.registrationIndex + 1 : 0;

  // insert new Registration
  await context.ensDb.insert(ensIndexerSchema.registration).values({
    id: makeRegistrationId(domainId, registrationIndex),
    registrationIndex,
    ...values,
  });

  // ensure this Registration is the latest
  await context.ensDb
    .insert(ensIndexerSchema.latestRegistrationIndex)
    .values({ domainId, registrationIndex })
    .onConflictDoUpdate({ registrationIndex });

  // conditionally materialize Domain.__latestRegistration*
  await materializeDomainLatestRegistration(context, domainId, {
    __latestRegistrationStart: values.start,
    __latestRegistrationExpiry: values.expiry ?? REGISTRATION_SORT_SENTINEL,
  });
}

/**
 * Updates the expiry of a Domain's latest Registration.
 *
 * @dev materializes Domain.__latestRegistrationExpiry
 * @dev callers MUST pass the Domain's _latest_ Registration; we don't validate that the provided
 *      `registrationId` is actually the latest
 */
export async function updateLatestRegistrationExpiry(
  context: IndexingEngineContext,
  {
    domainId,
    registrationId,
    expiry,
  }: {
    domainId: DomainId;
    registrationId: ReturnType<typeof makeRegistrationId>;
    expiry: bigint | null;
  },
) {
  await context.ensDb.update(ensIndexerSchema.registration, { id: registrationId }).set({ expiry });

  // conditionally materialize Domain.__latestRegistrationExpiry
  await materializeDomainLatestRegistration(context, domainId, {
    __latestRegistrationExpiry: expiry ?? REGISTRATION_SORT_SENTINEL,
  });
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
    id: makeRenewalId(domainId, registrationIndex, pointer.renewalIndex),
  });
}

/**
 * Inserts a Renewal and updates the latestRenewal pointer for its `domainId` and `registrationIndex`.
 */
export async function insertLatestRenewal(
  context: IndexingEngineContext,
  registration: Pick<typeof ensIndexerSchema.registration.$inferInsert, "registrationIndex">,
  values: Omit<
    typeof ensIndexerSchema.renewal.$inferInsert,
    "id" | "registrationIndex" | "renewalIndex"
  >,
) {
  const { registrationIndex } = registration;
  const { domainId } = values;

  // derive new Renewal's index from previous, if exists
  const previous = await getLatestRenewal(context, domainId, registrationIndex);
  const renewalIndex = previous ? previous.renewalIndex + 1 : 0;

  // insert new Renewal
  await context.ensDb.insert(ensIndexerSchema.renewal).values({
    id: makeRenewalId(domainId, registrationIndex, renewalIndex),
    registrationIndex,
    renewalIndex,
    ...values,
  });

  // ensure this Renewal is the latest
  await context.ensDb
    .insert(ensIndexerSchema.latestRenewalIndex)
    .values({ domainId, registrationIndex, renewalIndex })
    .onConflictDoUpdate({ renewalIndex });
}
