/**
 * This file contains handlers used in event handlers for a Registrar Controller contract.
 */
import type { Context } from "ponder:registry";

import type { RegistrarAction, RegistrarActionType } from "@ensnode/ensnode-sdk";

import { makeRegistrarAction } from "./registrar-action";
import { makeRegistrarEventRef } from "./registrar-event-ref";
import { markRegistrationAsManagedByController } from "./registration";

/**
 * Handles an individual occurrence of a Registrar Action of
 * given {@link RegistrarActionType}.
 */
export async function handleRegistrarAction(
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
    event,
  }: RegistrarAction,
) {
  // 1. Mark the Registration for the `node` value as controller-managed.
  await markRegistrationAsManagedByController(context, { node });

  // 2. Insert the Registrar Event record.
  await makeRegistrarEventRef(context, event);

  // 3. Insert the Registrar Action record.
  await makeRegistrarAction(context, {
    id: event.id,
    type,
    node,
    incrementalDuration,
    baseCost,
    premium,
    total,
    registrant,
    encodedReferrer,
    decodedReferrer,
    event,
  });
}
