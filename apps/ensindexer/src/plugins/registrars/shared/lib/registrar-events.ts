/**
 * This file contains handlers used in event handlers for a Registrar contract.
 */

import type { Context, Event } from "ponder:registry";
import schema from "ponder:schema";
import type { Address, Hash } from "viem";

import {
  type AccountId,
  bigIntToNumber,
  deserializeDuration,
  type Node,
  type RegistrarAction,
  RegistrarActionTypes,
  serializeAccountId,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";

/**
 * Logical Event Key
 *
 * String formatted as:
 * `{accountId}:{node}:{transactionHash}`, where `accountId` follows
 * the CAIP-10 standard.
 *
 * @see https://chainagnostic.org/CAIPs/caip-10
 */
export type LogicalEventKey = string;

export function makeLogicalEventKey({
  subregistryId,
  node,
  transactionHash,
}: {
  subregistryId: AccountId;
  node: Node;
  transactionHash: Hash;
}): LogicalEventKey {
  return [serializeAccountId(subregistryId), node, transactionHash].join(":");
}

async function getSubregistry(context: Context, { subregistryId }: { subregistryId: AccountId }) {
  return context.db.find(schema.subregistry, { subregistryId: serializeAccountId(subregistryId) });
}

async function getRegistrationLifecycle(context: Context, { node }: { node: Node }) {
  return context.db.find(schema.registrationLifecycle, { node });
}

/**
 * Make first registration
 *
 * Inserts a new record to track the current state of
 * the Registration Lifecycle by node value.
 */
async function makeFirstRegistration(
  context: Context,
  {
    subregistryId,
    node,
    expiresAt,
  }: {
    subregistryId: AccountId;
    node: Node;
    expiresAt: UnixTimestamp;
  },
) {
  return context.db.insert(schema.registrationLifecycle).values({
    subregistryId: serializeAccountId(subregistryId),
    node,
    expiresAt: BigInt(expiresAt),
  });
}

/**
 * Make subsequent registration
 *
 * Updates the current state of the Registration Lifecycle by node value.
 */
async function makeSubsequentRegistration(
  context: Context,
  {
    node,
    expiresAt,
  }: {
    node: Node;
    expiresAt: UnixTimestamp;
  },
) {
  return context.db
    .update(schema.registrationLifecycle, { node })
    .set({ expiresAt: BigInt(expiresAt) });
}

/**
 * Extend registration
 *
 * Updates the current state of the Registration Lifecycle by node value.
 */
async function extendRegistration(
  context: Context,
  {
    node,
    expiresAt,
  }: {
    node: Node;
    expiresAt: UnixTimestamp;
  },
) {
  return context.db
    .update(schema.registrationLifecycle, { node })
    .set({ expiresAt: BigInt(expiresAt) });
}

export async function initializeRegistrarActionRegistration(
  context: Context,
  {
    id,
    registrationLifecycle,
    registrant,
    block,
    transactionHash,
    eventIds,
  }: {
    id: RegistrarAction["id"];
    registrationLifecycle: RegistrarAction["registrationLifecycle"];
    registrant: RegistrarAction["registrant"];
    block: RegistrarAction["block"];
    transactionHash: RegistrarAction["transactionHash"];
    eventIds: RegistrarAction["eventIds"];
  },
  { expiresAt }: { expiresAt: UnixTimestamp },
) {
  const { node, subregistry } = registrationLifecycle;
  const { subregistryId } = subregistry;
  const type = RegistrarActionTypes.Renewal;

  // 1. Create logical event key
  const logicalEventKey = makeLogicalEventKey({
    node,
    subregistryId,
    transactionHash,
  });

  // 2. Store mapping between logical event key and logical event id
  await context.db.insert(schema.tempLogicalSubregistryAction).values({
    logicalEventKey,
    logicalEventId: id,
  });

  // 3. Calculate incremental duration
  const currentRegistrationLifecycle = await getRegistrationLifecycle(context, {
    node,
  });

  if (!currentRegistrationLifecycle) {
    throw new Error(
      `Current Registration Lifecycle record was not found for node '${registrationLifecycle.node}'`,
    );
  }

  const incrementalDuration = deserializeDuration(expiresAt - block.timestamp);

  // 4. Store initial record for the "logical" Registrar Action
  await context.db.insert(schema.registrarAction).values({
    id,
    subregistryId: serializeAccountId(subregistryId),
    type,
    node,
    incrementalDuration: BigInt(incrementalDuration),
    registrant,
    blockNumber: BigInt(block.number),
    blockTimestamp: BigInt(block.timestamp),
    transactionHash,
    eventIds,
  });
}

export async function initializeRegistrarActionRenewal(
  context: Context,
  {
    id,
    registrationLifecycle,
    registrant,
    block,
    transactionHash,
    eventIds,
  }: {
    id: RegistrarAction["id"];
    registrationLifecycle: RegistrarAction["registrationLifecycle"];
    registrant: RegistrarAction["registrant"];
    block: RegistrarAction["block"];
    transactionHash: RegistrarAction["transactionHash"];
    eventIds: RegistrarAction["eventIds"];
  },
  { expiresAt }: { expiresAt: UnixTimestamp },
) {
  const { node, subregistry } = registrationLifecycle;
  const { subregistryId } = subregistry;
  const type = RegistrarActionTypes.Renewal;

  // 1. Create logical event key
  const logicalEventKey = makeLogicalEventKey({
    node,
    subregistryId,
    transactionHash,
  });

  // 2. Store mapping between logical event key and logical event id
  await context.db.insert(schema.tempLogicalSubregistryAction).values({
    logicalEventKey,
    logicalEventId: id,
  });

  // 3. Calculate incremental duration
  const currentRegistrationLifecycle = await getRegistrationLifecycle(context, {
    node,
  });

  if (!currentRegistrationLifecycle) {
    throw new Error(
      `Current Registration Lifecycle record was not found for node '${registrationLifecycle.node}'`,
    );
  }

  const incrementalDuration = deserializeDuration(
    expiresAt - bigIntToNumber(currentRegistrationLifecycle.expiresAt),
  );

  // 4. Store initial record for the "logical" Registrar Action
  await context.db.insert(schema.registrarAction).values({
    id,
    subregistryId: serializeAccountId(subregistryId),
    type,
    node,
    incrementalDuration: BigInt(incrementalDuration),
    registrant,
    blockNumber: BigInt(block.number),
    blockTimestamp: BigInt(block.timestamp),
    transactionHash,
    eventIds,
  });
}

/**
 * Handle registration event
 */
export async function handleRegistration(
  context: Context,
  event: Event,
  {
    subregistryId,
    node,
    expiresAt,
    registrant,
  }: {
    subregistryId: AccountId;
    node: Node;
    expiresAt: UnixTimestamp;
    registrant: Address;
  },
) {
  // 0. Handle possible subsequent registration.
  //    Get the state of a possibly indexed registration record for this node
  //    before this registration occurred.
  const currentRegistrationLifecycle = await getRegistrationLifecycle(context, { node });

  if (currentRegistrationLifecycle) {
    // 1. If a RegistrationLifecycle for the `node` has been already indexed,
    // it means that  another RegistrationLifecycle was made for the `node` after
    // the previously indexed RegistrationLifecycle expired and its grace period ended.
    await makeSubsequentRegistration(context, { node, expiresAt });
  } else {
    // 1. It's a first-time registration made for the `node` value.
    await makeFirstRegistration(context, {
      subregistryId,
      node,
      expiresAt,
    });
  }

  // 2. Initialize the "logical" Registrar Action record for Registration
  const subregistry = await getSubregistry(context, { subregistryId });

  // Invariant: subregistry record must exist
  if (!subregistry) {
    throw new Error(`Subregistry record must exists for '${serializeAccountId(subregistryId)}.'`);
  }

  await initializeRegistrarActionRegistration(
    context,
    {
      id: event.id,
      registrationLifecycle: {
        expiresAt,
        node,
        subregistry: {
          subregistryId,
          node: subregistry.node,
        },
      },
      registrant,
      block: {
        number: bigIntToNumber(event.block.number),
        timestamp: bigIntToNumber(event.block.timestamp),
      },
      transactionHash: event.transaction.hash,
      eventIds: [event.id],
    },
    {
      expiresAt,
    },
  );
}

/**
 * Handle Renewal
 */
export async function handleRenewal(
  context: Context,
  event: Event,
  {
    subregistryId,
    node,
    expiresAt,
    registrant,
  }: {
    subregistryId: AccountId;
    node: Node;
    expiresAt: UnixTimestamp;
    registrant: Address;
  },
) {
  // TODO: 0. enforce an invariant that for Renewal actions,
  // the registration must be in a "renewable" state.
  // We can't add the state invariant about name renewals yet, because
  // doing so would require us to index more historical RegistrarControllers

  // 1. Initialize the "logical" Registrar Action record for Renewal
  const subregistry = await getSubregistry(context, { subregistryId });

  // Invariant: subregistry record must exist
  if (!subregistry) {
    throw new Error(`Subregistry record must exists for '${serializeAccountId(subregistryId)}.'`);
  }

  await initializeRegistrarActionRenewal(
    context,
    {
      id: event.id,
      registrationLifecycle: {
        expiresAt,
        node,
        subregistry: {
          subregistryId,
          node: subregistry.node,
        },
      },
      registrant,
      block: {
        number: bigIntToNumber(event.block.number),
        timestamp: bigIntToNumber(event.block.timestamp),
      },
      transactionHash: event.transaction.hash,
      eventIds: [event.id],
    },
    {
      expiresAt,
    },
  );

  // 2. Extend Registration's expiry after creating the Registrar Action
  //    record. This is important for calculating incremental duration
  //    value correctly.

  await extendRegistration(context, { node, expiresAt });
}
