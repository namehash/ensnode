/**
 * This file contains helpers for working with Registration Action records.
 */

import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import type { RegistrarAction } from "@ensnode/ensnode-sdk";

/**
 * Make Registrar Action record in database.
 */
export async function makeRegistrarAction(
  context: Context,
  {
    type,
    node,
    incrementalDuration,
    baseCost,
    premium,
    total,
    registrant,
    encodedReferrer,
    decodedReferrer,
    eventRef,
  }: RegistrarAction,
) {
  await context.db.insert(schema.registrarAction).values({
    id: eventRef.id,
    type,
    node,
    baseCost: baseCost.amount,
    premium: premium.amount,
    total: total.amount,
    registrant,
    encodedReferrer,
    decodedReferrer,
    incrementalDuration: BigInt(incrementalDuration),
  });
}
