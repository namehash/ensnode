import type { Context, Event } from "ponder:registry";
import schema from "ponder:schema";
import type { Address, Hash } from "viem";

import {
  type AccountId,
  type EncodedReferrer,
  isRegistrarActionReferralAvailable,
  type Node,
  type RegistrarActionReferral,
} from "@ensnode/ensnode-sdk";

import { makeLogicalEventKey } from "./registrar-action";

/**
 * Update the "logical registrar action":
 * - set referral data
 * - append new event ID to `eventIds`
 */
export async function handleUniversalRegistrarRenewalEvent(
  context: Context,
  {
    id,
    subregistryId,
    node,
    referral,
    transactionHash,
  }: {
    id: Event["id"];
    subregistryId: AccountId;
    node: Node;
    referral: RegistrarActionReferral;
    transactionHash: Hash;
  },
): Promise<void> {
  // 1. Make Logical Event Key
  const logicalEventKey = makeLogicalEventKey({
    subregistryId,
    node,
    transactionHash,
  });

  // 2. Use the Logical Event Key to get the "logical registrar action" record
  //    which needs to be updated.

  // 2. a) Find subregistryActionMetadata record by logical event key.
  const subregistryActionMetadata = await context.db.find(schema.internal_registrarActionMetadata, {
    logicalEventKey,
  });

  // Invariant: the subregistryActionMetadata record must be available for `logicalEventKey`
  if (!subregistryActionMetadata) {
    throw new Error(
      `The required "logical registrar action" ID could not be found for the following logical event key: '${logicalEventKey}'.`,
    );
  }

  const { logicalEventId } = subregistryActionMetadata;

  // 2. b) Find "logical registrar action" record by `logicalEventId`.
  const logicalRegistrarAction = await context.db.find(schema.registrarActions, {
    id: logicalEventId,
  });

  // Invariant: the "logical registrar action" record must be available for `logicalEventId`
  if (!logicalRegistrarAction) {
    throw new Error(
      `The "logical registrar action" record, which could not be found for the following logical event ID: '${logicalEventId}'.`,
    );
  }

  // 3. Prepare referral info
  let encodedReferrer: EncodedReferrer | null;
  let decodedReferrer: Address | null;

  if (isRegistrarActionReferralAvailable(referral)) {
    encodedReferrer = referral.encodedReferrer;
    decodedReferrer = referral.decodedReferrer;
  } else {
    encodedReferrer = null;
    decodedReferrer = null;
  }

  // 4. Update the "logical registrar action" record with
  //    - referral data
  //    - new event ID appended to `eventIds`
  await context.db
    .update(schema.registrarActions, { id: logicalRegistrarAction.id })
    .set(({ eventIds }) => ({
      encodedReferrer,
      decodedReferrer,
      eventIds: [...eventIds, id],
    }));
}
