import type { Context, Event } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import {
  type AccountId,
  type EncodedReferrer,
  isRegistrarActionPricingAvailable,
  isRegistrarActionReferralAvailable,
  type Node,
  type RegistrarActionPricing,
  type RegistrarActionReferral,
} from "@ensnode/ensnode-sdk";

import { type LogicalEventKey, makeLogicalEventKey } from "../../shared/lib/registrar-events";

/**
 * Get "logical" Registrar Action record by logical event key.
 *
 * @throws if the record cannot be found.
 */
async function getLogicalRegistrarAction(context: Context, logicalEventKey: LogicalEventKey) {
  const tempRecord = await context.db.find(schema.tempLogicalSubregistryAction, {
    logicalEventKey,
  });

  // Invariant: the "logical" Registrar Action ID must be available
  if (!tempRecord) {
    throw new Error(
      `Handling Registrar Controller Registration action requires the "logical" Registrar Action ID, which could not be found for the following logical event key: '${logicalEventKey}'.`,
    );
  }

  const { logicalEventId } = tempRecord;

  const logicalRegistrarAction = await context.db.find(schema.registrarAction, {
    id: logicalEventId,
  });

  // Invariant: the "logical" Registrar Action record must be available
  if (!logicalRegistrarAction) {
    throw new Error(
      `Handling Registrar Controller Registration action requires the "logical" Registrar Action record, which could not be found for the following logical event ID: '${logicalEventId}'.`,
    );
  }

  return logicalRegistrarAction;
}

/**
 * Update the "logical" Registrar Action:
 * - set pricing data (if available)
 * - set referral data (if available)
 * - append new event ID to `eventIds`
 */
export async function handleRegistrarControllerEvent(
  context: Context,
  event: Event,
  {
    subregistryId,
    node,
    pricing,
    referral,
  }: {
    subregistryId: AccountId;
    node: Node;
    pricing: RegistrarActionPricing;
    referral: RegistrarActionReferral;
  },
) {
  const logicalEventKey = makeLogicalEventKey({
    subregistryId,
    node,
    transactionHash: event.transaction.hash,
  });

  // get the "logical" Registrar Action to update
  const { id } = await getLogicalRegistrarAction(context, logicalEventKey);

  // get pricing info
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

  // get referral info
  let encodedReferrer: EncodedReferrer | null;
  let decodedReferrer: Address | null;

  if (isRegistrarActionReferralAvailable(referral)) {
    encodedReferrer = referral.encodedReferrer;
    decodedReferrer = referral.decodedReferrer;
  } else {
    encodedReferrer = null;
    decodedReferrer = null;
  }

  // update pricing data & referral data accordingly
  // plus, append new event id to `eventIds`
  await context.db.update(schema.registrarAction, { id }).set((logicalRegistrarAction) => ({
    baseCost,
    premium,
    total,
    encodedReferrer,
    decodedReferrer,
    eventIds: [...logicalRegistrarAction.eventIds, event.id],
  }));
}
