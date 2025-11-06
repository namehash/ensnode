import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Hash } from "viem";

import {
  type AccountId,
  type Node,
  type RegistrarAction,
  serializeAccountId,
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

/**
 * Make a logical event key for a "logical" registrar action.
 */
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

/**
 * Get "logical" Registrar Action record by logical event key.
 *
 * @throws if the record cannot be found.
 */
export async function getLogicalRegistrarActionByEventKey(
  context: Context,
  logicalEventKey: LogicalEventKey,
) {
  const tempRecord = await context.db.find(schema.internal_subregistryActionMetadata, {
    logicalEventKey,
  });

  // Invariant: the "logical" Registrar Action ID must be available
  if (!tempRecord) {
    throw new Error(
      `The required "logical" Registrar Action ID could not be found for the following logical event key: '${logicalEventKey}'.`,
    );
  }

  const { logicalEventId } = tempRecord;

  const logicalRegistrarAction = await context.db.find(schema.registrarActions, {
    id: logicalEventId,
  });

  // Invariant: the "logical" Registrar Action record must be available
  if (!logicalRegistrarAction) {
    throw new Error(
      `The "logical" Registrar Action record, which could not be found for the following logical event ID: '${logicalEventId}'.`,
    );
  }

  // Drop the temp record, as it won't be needed anymore.
  await context.db.delete(schema.internal_subregistryActionMetadata, { logicalEventKey });

  return logicalRegistrarAction;
}

/**
 * Initialize a record for the "logical" Registrar Action.
 */
export async function initializeRegistrarAction(
  context: Context,
  {
    id,
    type,
    registrationLifecycle,
    incrementalDuration,
    registrant,
    block,
    transactionHash,
    eventIds,
  }: Omit<RegistrarAction, "pricing" | "referral">,
) {
  const { node, subregistry } = registrationLifecycle;
  const { subregistryId } = subregistry;

  // 1. Create logical event key
  const logicalEventKey = makeLogicalEventKey({
    node,
    subregistryId,
    transactionHash,
  });

  // 2. Store mapping between logical event key and logical event id
  await context.db.insert(schema.internal_subregistryActionMetadata).values({
    logicalEventKey,
    logicalEventId: id,
  });

  // 4. Store initial record for the "logical" Registrar Action
  await context.db.insert(schema.registrarActions).values({
    id,
    type,
    subregistryId: serializeAccountId(subregistryId),
    node,
    incrementalDuration: BigInt(incrementalDuration),
    registrant,
    blockNumber: BigInt(block.number),
    timestamp: BigInt(block.timestamp),
    transactionHash,
    eventIds,
  });
}
