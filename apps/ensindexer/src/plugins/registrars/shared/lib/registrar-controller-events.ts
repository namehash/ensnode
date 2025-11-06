import type { Context, Event } from "ponder:registry";
import schema from "ponder:schema";
import type { Address, Hash } from "viem";

import {
  type AccountId,
  type EncodedReferrer,
  isRegistrarActionPricingAvailable,
  isRegistrarActionReferralAvailable,
  type Node,
  type RegistrarActionPricing,
  type RegistrarActionReferral,
} from "@ensnode/ensnode-sdk";

import { getLogicalRegistrarActionByEventKey, makeLogicalEventKey } from "./registrar-action";

/**
 * Update the "logical" Registrar Action:
 * - set pricing data (if available)
 * - set referral data (if available)
 * - append new event ID to `eventIds`
 */
export async function handleRegistrarControllerEvent(
  context: Context,
  {
    id,
    subregistryId,
    node,
    pricing,
    referral,
    transactionHash,
  }: {
    id: Event["id"];
    subregistryId: AccountId;
    node: Node;
    pricing: RegistrarActionPricing;
    referral: RegistrarActionReferral;
    transactionHash: Hash;
  },
) {
  // 1. Make Logical Event Key
  const logicalEventKey = makeLogicalEventKey({
    subregistryId,
    node,
    transactionHash,
  });

  // 2. Use the Logical Event Key to get the "logical" Registrar Action record
  //    which needs to be updated.
  const logicalRegistrarAction = await getLogicalRegistrarActionByEventKey(
    context,
    logicalEventKey,
  );

  // 3. Prepare pricing info
  let baseCost: bigint | null;
  let premium: bigint | null;
  let total: bigint | null;

  if (isRegistrarActionPricingAvailable(pricing)) {
    baseCost = pricing.baseCost.amount;
    premium = pricing.premium.amount;
    total = pricing.total.amount;
  } else {
    baseCost = null;
    premium = null;
    total = null;
  }

  // 4. Prepare referral info
  let encodedReferrer: EncodedReferrer | null;
  let decodedReferrer: Address | null;

  if (isRegistrarActionReferralAvailable(referral)) {
    encodedReferrer = referral.encodedReferrer;
    decodedReferrer = referral.decodedReferrer;
  } else {
    encodedReferrer = null;
    decodedReferrer = null;
  }

  // 5. Update the "logical" Registrar Action record with
  //    - pricing data,
  //    - referral data
  //    - new event ID appended to `eventIds`
  await context.db
    .update(schema.registrarActions, { id: logicalRegistrarAction.id })
    .set(({ eventIds }) => ({
      baseCost,
      premium,
      total,
      encodedReferrer,
      decodedReferrer,
      eventIds: [...eventIds, id],
    }));
}
