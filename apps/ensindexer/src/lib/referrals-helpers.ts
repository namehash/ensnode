/**
 * Shared Helpers for managing Referral entities, usable by any contract that wishes to track
 * referral information.
 */

import { Context, Event } from "ponder:registry";
import { Address, Hex, zeroHash } from "viem";

import schema from "ponder:schema";
import { Node } from "@ensnode/ensnode-sdk";

/**
 * Upserts a Referrer and aggregates their `valueWei`.
 */
async function updateReferrerWithValue(context: Context, referrer: Hex, valueWei: bigint) {
  await context.db
    .insert(schema.ext_referrer)
    .values({
      id: referrer,
      valueWei,
    })
    .onConflictDoUpdate((referrer) => ({
      valueWei: referrer.valueWei + valueWei,
    }));
}

/**
 * Handles an individual occurance of a referral for ENS name registration.
 */
export async function handleRegistrationReferral(
  context: Context,
  event: Event,
  {
    referrer,
    referee,
    node,
    baseCost,
    premium,
  }: {
    referrer: Hex;
    referee: Address;
    node: Node;
    baseCost: bigint;
    premium: bigint;
  },
) {
  // Invariant: A referrer must be specified
  if (referrer === zeroHash) {
    throw new Error(
      `Invariant(handleRegistrationReferral): Referrer is required, received ${referrer}.`,
    );
  }

  const total = baseCost + premium;

  // create the Referral event
  await context.db.insert(schema.ext_registrationReferral).values({
    id: event.id,

    // referral data
    referrerId: referrer,
    refereeId: referee,
    domainId: node,
    baseCost,
    premium,
    total,

    // metadata
    chainId: context.chain.id,
    transactionHash: event.transaction.hash,
    timestamp: event.block.timestamp,
  });

  // aggregate referrer value
  await updateReferrerWithValue(context, referrer, total);
}

/**
 * Handles an individual occurance of a referral for ENS name renewal.
 */
export async function handleRenewalReferral(
  context: Context,
  event: Event,
  {
    referrer,
    referee,
    node,
    cost,
  }: {
    referrer: Hex;
    referee: Address;
    node: Node;
    cost: bigint;
  },
) {
  // Invariant: A referrer must be specified
  if (referrer === zeroHash) {
    throw new Error(
      `Invariant(handleRenewalReferral): Referrer is required, received ${referrer}.`,
    );
  }

  // create the Referral event
  await context.db.insert(schema.ext_renewalReferral).values({
    id: event.id,

    // referral data
    referrerId: referrer,
    refereeId: referee,
    domainId: node,
    cost,

    // metadata
    chainId: context.chain.id,
    transactionHash: event.transaction.hash,
    timestamp: event.block.timestamp,
  });

  // aggregate referrer value
  await updateReferrerWithValue(context, referrer, cost);
}
