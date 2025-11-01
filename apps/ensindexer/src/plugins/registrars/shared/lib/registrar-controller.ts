/**
 * This file contains helpers for working with Registrar Controller records.
 */

import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import type { ChainId } from "@ensnode/ensnode-sdk";

/**
 * Add a Registrar Controller address to Registrar record in database.
 */
export async function addControllerToRegistrar(
  context: Context,
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
  await context.db
    .insert(schema.registrarController)
    .values({
      chainId,
      controllerAddress,
      registrarAddress,
      isActive: true,
    })
    .onConflictDoUpdate({ isActive: true });
}

/**
 * Remove a Registrar Controller address from Registrar record in database.
 */
export async function removedControllerFromRegistrar(
  context: Context,
  { chainId, controllerAddress }: { chainId: ChainId; controllerAddress: Address },
) {
  await context.db
    .update(schema.registrarController, {
      chainId,
      controllerAddress,
    })
    .set({
      isActive: false,
    });
}
