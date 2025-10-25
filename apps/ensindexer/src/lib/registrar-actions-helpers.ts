/**
 * Shared Helpers for managing Referral entities, usable by any contract that wishes to track
 * referral information.
 */

import type { Context, Event } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import {
  type Node,
  Price,
  type RawReferrer,
  RegistrarActionType,
  type RegistrarActionTypes,
  interpretRawReferrer,
} from "@ensnode/ensnode-sdk";

/**
 * Get the incremental duration for Registrar Action.
 *
 * Definition of "incremental duration" is
 * the incremental increase in the lifespan of the current registration.
 *
 * Please consider the following situation:
 *
 * A registration of direct subname of .eth is scheduled to expire on
 * Jan 1, midnight UTC. It is currently 30 days after this expiration time.
 * Therefore, there are currently another 60 days of grace period remaining
 * for this name. Anyone can now make a renewal of this name.
 *
 * There are two possible scenarios when a renewal is made:
 *
 * 1) If a renewal is made for 10 days incremental duration,
 *    this name remains in an "expired" state, but it now
 *    has another 70 days of grace period remaining.
 *
 * 2) If a renewal is made for 50 days incremental duration,
 *    this name is no longer "expired" and is active, but it now
 *    expires in 20 days.
 *
 * After the latest registration of a direct subname becomes expired by
 * more than the grace period, it can no longer be renewed by anyone.
 * It must first be registered again, starting a new registration lifecycle of
 * expiry / grace period / etc.
 *
 * @returns incremental duration in seconds.
 * @throws if Registrar Action is Renewal and no related
 *         Registration was indexed before.
 */
export async function getIncrementalDurationForRegistrarAction(
  context: Context,
  event: Event,
  registrarAction: {
    type: RegistrarActionTypes;
    node: Node;
    expiresAt: bigint;
  },
): Promise<bigint> {
  let incrementalDurationStartsAt: bigint;
  const incrementalDurationEndsAt = registrarAction.expiresAt;

  switch (registrarAction.type) {
    case RegistrarActionType.Registration:
      incrementalDurationStartsAt = event.block.timestamp;
      break;

    case RegistrarActionType.Renewal:
      {
        const currentRegistration = await context.db.find(schema.subregistry_registration, {
          node: registrarAction.node,
        });

        // Invariant: the current registration must exists for the renewal to take place.
        if (!currentRegistration) {
          throw new Error(
            `The current registration for "${registrarAction.node}" node must exist for the renewal to take place.`,
          );
        }

        incrementalDurationStartsAt = currentRegistration.expiresAt;
      }
      break;

    default:
      throw new Error(`Unhandled Registrar Action type: "${registrarAction.type}"`);
  }

  // Invariant: the end of the incremental duration must be after its start.
  if (incrementalDurationEndsAt < incrementalDurationStartsAt) {
    throw new Error(`Incremental Duration end timestamp must be after its start timestamp.`);
  }

  // Calculate and return the incremental duration
  return incrementalDurationEndsAt - incrementalDurationStartsAt;
}

/**
 * Handles an individual occurrence of a Registrar Action of
 * given {@link RegistrarActionType}.
 */
export async function handleRegistrarAction(
  context: Context,
  event: Event,
  {
    type,
    node,
    expiresAt,
    baseCost,
    premium,
    registrant,
    rawReferrer,
  }: {
    type: RegistrarActionTypes;
    node: Node;
    expiresAt: bigint;
    baseCost: Price;
    premium: Price;
    registrant: Address;
    rawReferrer: RawReferrer;
  },
) {
  // 0. Calculate total cost
  const total = baseCost.amount + premium.amount;

  // 1. Interpret the raw referrer
  const interpretedReferrer = interpretRawReferrer(rawReferrer);

  // 2. Get incremental duration for handled registrar action
  const incrementalDuration = await getIncrementalDurationForRegistrarAction(context, event, {
    type,
    node,
    expiresAt,
  });

  // 3. Update the Subregistry Registration record
  // This record represents the current registration state for the `node`.
  // The record must already exist, as it is created upon handling
  // the Base Registrar:NameRegistered event.
  await context.db
    .update(schema.subregistry_registration, {
      node,
    })
    .set({
      expiresAt,
    });

  // 4. Insert the Registrar Action record
  await context.db.insert(schema.subregistry_registrarAction).values({
    id: event.id,
    type,
    node,
    expiresAt,
    baseCost: baseCost.amount,
    premium: premium.amount,
    total,
    registrant,
    rawReferrer,
    interpretedReferrer,
    incrementalDuration,
    blockTimestamp: event.block.timestamp,
    chainId: context.chain.id,
    transactionHash: event.transaction.hash,
  });
}
