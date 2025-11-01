/**
 * This file contains helpers for working with Registration records.
 */

import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import type { Node, UnixTimestamp } from "@ensnode/ensnode-sdk";

import { buildRegistration, type Registration } from "@/lib/registrars/registration";

/**
 * Make the very first Registration record in database for the `node` value.
 */
export async function makeFirstRegistration(
  context: Context,
  {
    node,
    parentNode,
    expiresAt,
  }: {
    node: Node;
    parentNode: Node;
    expiresAt: UnixTimestamp;
  },
) {
  await context.db.insert(schema.registration).values({
    node,
    parentNode,
    expiresAt: BigInt(expiresAt),
  });
}

/**
 * Make a subsequent Registration by updating record in database for
 * the `node` value.
 */
export async function makeSubsequentRegistration(
  context: Context,
  {
    node,
    expiresAt,
  }: {
    node: Node;
    expiresAt: UnixTimestamp;
  },
) {
  await context.db.update(schema.registration, { node }).set({
    expiresAt: BigInt(expiresAt),

    /**
     * Unmark registration with `node` as controller-managed.
     *
     * Imagine the following scenario occurs:
     * 1) A controller-managed registration for a `node` expired and
     *    its grace period has ended.
     * 2) A new registration is made for the `node` with
     *    an unknown Registrar Controller.
     *
     * Then, the indexed Registration record for the `node` must be
     * marked as not managed by Registrar Controller, as we don't index
     * that controller with ENSNode.
     */
    isControllerManaged: false,
  });
}

/**
 * Extends expiry for Registration record in database with `node`.
 */
export async function renewRegistration(
  context: Context,
  {
    node,
    expiresAt,
  }: {
    node: Node;
    expiresAt: UnixTimestamp;
  },
) {
  await context.db.update(schema.registration, { node }).set({
    expiresAt: BigInt(expiresAt),
  });
}

/**
 * Mark Registration record in database with `node` as controller-managed.
 *
 * When a Registrar Controller emits "NameRegistered" event, or
 * "NameRenewed" event, we want the relevant Registration to
 * highlight that fact. It will help us extend the coverage of
 * indexed Registrar Controllers, as we don't know them all yet.
 */
export async function markRegistrationAsManagedByController(
  context: Context,
  {
    node,
  }: {
    node: Node;
  },
) {
  await context.db.update(schema.registration, { node }).set({
    isControllerManaged: true,
  });
}

/**
 * Get currently indexed subregistry Registration record from database for
 * a node.
 */
export async function getCurrentRegistration(
  context: Context,
  { node }: { node: Node },
): Promise<Registration | null> {
  const currentRegistration = await context.db.find(schema.registration, {
    node,
  });

  if (!currentRegistration) {
    return null;
  }

  return buildRegistration(currentRegistration);
}
