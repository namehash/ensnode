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
 * Fully lowercase string formatted as:
 * `{accountId}:{node}:{transactionHash}`, where `accountId` follows
 * the CAIP-10 standard.
 *
 * @see https://chainagnostic.org/CAIPs/caip-10
 */
export type LogicalEventKey = string;

/**
 * Make a logical event key for a "logical registrar action".
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
  return [serializeAccountId(subregistryId), node, transactionHash].join(":").toLowerCase();
}

/**
 * Insert a record for the "logical registrar action".
 */
export async function insertRegistrarAction(
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
): Promise<void> {
  const { node, subregistry } = registrationLifecycle;
  const { subregistryId } = subregistry;

  // 1. Create logical event key
  const logicalEventKey = makeLogicalEventKey({
    node,
    subregistryId,
    transactionHash,
  });

  // 2. Store mapping between logical event key and logical event id
  await context.db.insert(schema.internal_registrarActionMetadata).values({
    logicalEventKey,
    logicalEventId: id,
  });

  // 3. Store initial record for the "logical registrar action"
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
