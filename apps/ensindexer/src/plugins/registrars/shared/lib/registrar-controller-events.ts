import type { Context, Event } from "ponder:registry";
import schema from "ponder:schema";
import type { Address, Hash } from "viem";

import {
  type EncodedReferrer,
  isRegistrarActionPricingAvailable,
  isRegistrarActionReferralAvailable,
  type Node,
  type RegistrarActionPricing,
  type RegistrarActionReferral,
} from "@ensnode/ensnode-sdk";

import { makeLogicalEventKey } from "./registrar-action";

/**
 * Update the "logical registrar action":
 * - set pricing data (if available)
 * - set referral data (if available)
 * - append new event ID to `eventIds`
 */
export async function handleRegistrarControllerEvent(
  context: Context,
  {
    id,
    node,
    pricing,
    referral,
    transactionHash,
  }: {
    id: Event["id"];
    node: Node;
    pricing: RegistrarActionPricing;
    referral: RegistrarActionReferral;
    transactionHash: Hash;
  },
): Promise<void> {
  // 1. Make Logical Event Key
  const logicalEventKey = makeLogicalEventKey({
    node,
    transactionHash,
  });

  // 2. Use the Logical Event Key to get the "logical registrar action" record
  //    which needs to be updated.

  // 2. a) Find registrarActionMetadata record for the current "logical registrar action".
  const registrarActionMetadata = await context.db.find(schema.internal_registrarActionMetadata, {
    metadataType: "CURRENT_LOGICAL_REGISTRAR_ACTION",
  });

  // Invariant: the registrarActionMetadata record must exist
  if (!registrarActionMetadata) {
    throw new Error(
      `The required "logical registrar action" ID could not be found for the following logical event key: '${logicalEventKey}'.`,
    );
  }

  // Invariant: the stored logical event key must match the current logical event key
  if (registrarActionMetadata.logicalEventKey !== logicalEventKey) {
    throw new Error(
      `The logical event key ('${registrarActionMetadata.logicalEventKey}') for the "logical registrar action" record must be same as the current logical event key ('${logicalEventKey}').`,
    );
  }

  // 2. b) Find "logical registrar action" record by `logicalEventId`.
  const logicalRegistrarAction = await context.db.find(schema.registrarActions, {
    id: registrarActionMetadata.logicalEventId,
  });

  // Invariant: the "logical registrar action" record must be available for `logicalEventId`
  if (!logicalRegistrarAction) {
    throw new Error(
      `The "logical registrar action" record, which could not be found for the following logical event ID: '${registrarActionMetadata.logicalEventId}'.`,
    );
  }

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

  // 5. Update the "logical registrar action" record with
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
