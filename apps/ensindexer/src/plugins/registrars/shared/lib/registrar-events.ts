/**
 * This file contains handlers used in event handlers for a Registrar contract.
 */

import type { Context, Event } from "ponder:registry";
import type { Address, Hash } from "viem";

import {
  type AccountId,
  type BlockRef,
  bigIntToNumber,
  durationBetween,
  formatAccountId,
  type Node,
  RegistrarActionTypes,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";

import { insertRegistrarAction } from "./registrar-action";
import {
  getRegistrationLifecycle,
  insertRegistrationLifecycle,
  updateRegistrationLifecycle,
} from "./registration-lifecycle";
import { getSubregistry } from "./subregistry";

/**
 * Handle Registrar Event: Registration
 */
export async function handleRegistrarEventRegistration(
  context: Context,
  {
    id,
    subregistryId,
    node,
    registrant,
    expiresAt,
    block,
    transactionHash,
  }: {
    id: Event["id"];
    subregistryId: AccountId;
    node: Node;
    registrant: Address;
    expiresAt: UnixTimestamp;
    block: BlockRef;
    transactionHash: Hash;
  },
): Promise<void> {
  // 0. Handle possible subsequent registration.
  //    Get the state of a possibly indexed registration record for this node
  //    before this registration occurred.
  const currentRegistrationLifecycle = await getRegistrationLifecycle(context, { node });

  if (currentRegistrationLifecycle) {
    // 1. If a RegistrationLifecycle for the `node` has been already indexed,
    // it means that  another RegistrationLifecycle was made for the `node` after
    // the previously indexed RegistrationLifecycle expired and its grace period ended.
    await updateRegistrationLifecycle(context, { node, expiresAt });
  } else {
    // 1. It's a first-time registration made for the `node` value.
    await insertRegistrationLifecycle(context, {
      subregistryId,
      node,
      expiresAt,
    });
  }

  // 1. Get subregistry details.
  const subregistry = await getSubregistry(context, { subregistryId });

  // Invariant: subregistry record must exist
  if (!subregistry) {
    throw new Error(`Subregistry record must exists for '${formatAccountId(subregistryId)}.'`);
  }

  // 3. Calculate incremental duration
  const incrementalDuration = durationBetween(
    block.timestamp, // current block timestamp
    expiresAt, // registrations lifecycle expiry date
  );

  // 4. Initialize the "logical registrar action" record for Registration
  await insertRegistrarAction(context, {
    id,
    type: RegistrarActionTypes.Registration,
    registrationLifecycle: {
      expiresAt,
      node,
      subregistry: {
        subregistryId,
        node: subregistry.node,
      },
    },
    incrementalDuration,
    registrant,
    block,
    transactionHash,
    eventIds: [id],
  });
}

/**
 * Handle Registrar Event: Renewal
 */
export async function handleRegistrarEventRenewal(
  context: Context,
  {
    id,
    subregistryId,
    node,
    registrant,
    expiresAt,
    block,
    transactionHash,
  }: {
    id: Event["id"];
    subregistryId: AccountId;
    node: Node;
    registrant: Address;
    expiresAt: UnixTimestamp;
    block: BlockRef;
    transactionHash: Hash;
  },
): Promise<void> {
  // TODO: 0. enforce an invariant that for Renewal actions,
  // the registration must be in a "renewable" state.
  // We can't add the state invariant about name renewals yet, because
  // doing so would require us to index more historical RegistrarControllers

  // 1. Get subregistry details.
  const subregistry = await getSubregistry(context, { subregistryId });

  // Invariant: subregistry record must exist
  if (!subregistry) {
    throw new Error(`Subregistry record must exists for '${formatAccountId(subregistryId)}.'`);
  }

  // 2. Get the current registration lifecycle before this registrar action
  //    could update it.
  const currentRegistrationLifecycle = await getRegistrationLifecycle(context, {
    node,
  });

  if (!currentRegistrationLifecycle) {
    throw new Error(`Current Registration Lifecycle record was not found for node '${node}'`);
  }

  // 3. Calculate incremental duration
  const incrementalDuration = durationBetween(
    bigIntToNumber(currentRegistrationLifecycle.expiresAt), // current expiry date
    expiresAt, // new expiry date
  );

  // 4. Initialize the "logical registrar action" record for Renewal
  await insertRegistrarAction(context, {
    id,
    type: RegistrarActionTypes.Renewal,
    registrationLifecycle: {
      expiresAt,
      node,
      subregistry: {
        subregistryId,
        node: subregistry.node,
      },
    },
    incrementalDuration,
    registrant,
    block,
    transactionHash,
    eventIds: [id],
  });

  // 5. Extend Registration Lifecycle's expiry.
  await updateRegistrationLifecycle(context, { node, expiresAt });
}
