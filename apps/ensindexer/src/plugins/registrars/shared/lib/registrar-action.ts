import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Hash } from "viem";

import { formatAccountId, type Node, type RegistrarAction } from "@ensnode/ensnode-sdk";

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
  node,
  transactionHash,
}: {
  node: Node;
  transactionHash: Hash;
}): LogicalEventKey {
  return [node, transactionHash].join(":").toLowerCase();
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
    transactionHash,
  });

  // 2. Store mapping between logical event key and logical event id
  //    Note: If the metadata record already exists,
  //          we update it to point to the current logical event key and id.
  //          This ensures that there is always at most one record in ENSDb
  //          for the current "logical registrar action".
  await context.db
    .insert(schema.internal_registrarActionMetadata)
    .values({
      metadataType: "CURRENT_LOGICAL_REGISTRAR_ACTION",
      logicalEventKey,
      logicalEventId: id,
    })
    .onConflictDoUpdate(() => ({
      logicalEventKey,
      logicalEventId: id,
    }));

  // 3. Store initial record for the "logical registrar action"
  await context.db.insert(schema.registrarActions).values({
    id,
    type,
    subregistryId: formatAccountId(subregistryId),
    node,
    incrementalDuration: BigInt(incrementalDuration),
    registrant,
    blockNumber: BigInt(block.number),
    timestamp: BigInt(block.timestamp),
    transactionHash,
    eventIds,
  });
}
