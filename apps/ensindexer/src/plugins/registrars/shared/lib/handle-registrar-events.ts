/**
 * This file contains handlers used in event handlers for a Registrar contract.
 */
import type { Context } from "ponder:registry";
import type { Address } from "viem";

import type {
  ChainId,
  RegistrarEventRefControllerAdded,
  RegistrarEventRefControllerRemoved,
  RegistrarEventRefNameRegistered,
  RegistrarEventRefNameRenewed,
} from "@ensnode/ensnode-sdk";

import type { Registration } from "@/lib/registrars/registration";

import { addControllerToRegistrar, removedControllerFromRegistrar } from "./registrar-controller";
import { makeRegistrarEventRef } from "./registrar-event-ref";
import {
  getCurrentRegistration,
  makeFirstRegistration,
  makeSubsequentRegistration,
  renewRegistration,
} from "./registration";

/**
 * Handle Registration
 */
export async function handleRegistration(
  context: Context,
  event: RegistrarEventRefNameRegistered,
  { node, parentNode, expiresAt }: Registration,
) {
  // 0. Handle possible subsequent registration.
  //    Get the state of a possibly indexed registration record for this node
  //    before this registration occurred.
  const currentRegistration = await getCurrentRegistration(context, { node });

  if (currentRegistration !== null) {
    // 1. If a Registration for the `node` has been already indexed, and
    // we now have to handle `NameRegistered` event, it means that
    // another Registration was made for the `node` after
    // the previously indexed Registration expired and its grace period ended.
    await makeSubsequentRegistration(context, { node, expiresAt });
  } else {
    // 1. It's a first-time registration made for the `node` value.
    await makeFirstRegistration(context, {
      node,
      parentNode,
      expiresAt,
    });
  }

  // 2. Insert the Registrar Event record.
  await makeRegistrarEventRef(context, event);
}

/**
 * Handle Renewal
 */
export async function handleRenewal(
  context: Context,
  event: RegistrarEventRefNameRenewed,
  { node, expiresAt }: Pick<Registration, "node" | "expiresAt">,
) {
  // TODO: 0. enforce an invariant that for Renewal actions,
  // the registration must be in a "renewable" state.
  // We can't add the state invariant about name renewals yet, because
  // doing so would require us to index more historical RegistrarControllers

  // 1. Extends Registration's expiry
  await renewRegistration(context, { node, expiresAt });

  // 2. Insert the Registrar Event record.
  await makeRegistrarEventRef(context, event);
}

/**
 * Handle Controller being added to Registrar.
 */
export async function handleControllerAddedToRegistrar(
  context: Context,
  event: RegistrarEventRefControllerAdded,
  {
    chainId,
    controllerAddress,
    registrarAddress,
  }: {
    chainId: ChainId;
    controllerAddress: Address;
    registrarAddress: Address;
  },
) {
  // 1. Update Registrar Controller
  await addControllerToRegistrar(context, {
    chainId,
    controllerAddress,
    registrarAddress,
  });

  // 2. Insert the Registrar Event record.
  await makeRegistrarEventRef(context, event);
}

/**
 * Handle Controller being removed from Registrar.
 */
export async function handleControllerRemovedFromRegistrar(
  context: Context,
  event: RegistrarEventRefControllerRemoved,
  {
    chainId,
    controllerAddress,
  }: {
    chainId: ChainId;
    controllerAddress: Address;
  },
) {
  // 1. Update Registrar Controller
  await removedControllerFromRegistrar(context, {
    chainId,
    controllerAddress,
  });

  // 2. Insert the Registrar Event record.
  await makeRegistrarEventRef(context, event);
}
