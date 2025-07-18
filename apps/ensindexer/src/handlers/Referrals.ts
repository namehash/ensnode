/**
 * Shared Handlers for managing Referral entities, usable by any contract that wishes to track
 * referral information.
 */

import { Context } from "ponder:registry";
import { EventWithArgs } from "@/lib/ponder-helpers";
import { Address, Hex, zeroHash } from "viem";

import schema from "ponder:schema";
import { Node } from "@ensnode/ensnode-sdk";

/**
 * Handles an individual occurance of a referral for ENS name registration.
 */
export async function handleRegistrationReferral({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{
    referrer: Hex;
    node: Node;
    referee: Address;
    baseCost: bigint;
    premium: bigint;
  }>;
}) {
  const { referrer, node, referee, baseCost, premium } = event.args;

  // no referrer, no-op
  if (referrer === zeroHash) return;

  const total = baseCost + premium;

  // create the Referral event
  await context.db.insert(schema.ext_registrationReferral).values({
    id: event.id,

    // referral data
    referrerId: referrer,
    domainId: node,
    refereeId: referee,
    baseCost,
    premium,
    total,

    // metadata
    chainId: context.chain.id,
    transactionHash: event.transaction.hash,
    timestamp: event.block.timestamp,
  });

  // upsert the Referrer, adding to their total if already exists
  await context.db
    .insert(schema.ext_referrer)
    .values({
      id: referrer,
      valueWei: total,
    })
    .onConflictDoUpdate((referrer) => ({
      valueWei: referrer.valueWei + total,
    }));
}

/**
 * Handles an individual occurance of a referral for ENS name renewal.
 */
export async function handleRenewalReferral({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{
    referrer: Hex;
    node: Node;
    referee: Address;
    cost: bigint;
  }>;
}) {
  const { referrer, node, referee, cost } = event.args;

  // no referrer, no-op
  if (referrer === zeroHash) return;

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

  // upsert the Referrer, adding to their total if already exists
  await context.db
    .insert(schema.ext_referrer)
    .values({
      id: referrer,
      valueWei: cost,
    })
    .onConflictDoUpdate((referrer) => ({
      valueWei: referrer.valueWei + cost,
    }));
}
