/**
 * Ponder Indexing Status
 *
 * Defines the structure and validation for the Ponder Indexing Status response.
 * @see https://ponder.sh/docs/advanced/observability#indexing-status
 */

import { prettifyError, z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import type { BlockRef } from "../block";
import { blockRefSchema } from "../block";
import type { ChainId } from "../chain";
import { chainIdSchema } from "../chain";

const schemaSerializedChainName = z.string();

const schemaSerializedChainBlockRef = z.object({
  id: chainIdSchema,
  block: blockRefSchema,
});

export type SerializedChainBlockRef = z.infer<typeof schemaSerializedChainBlockRef>;

function invariant_includesAtLeastOneIndexedChain(
  ctx: ParsePayload<SerializedPonderIndexingStatus>,
) {
  const records = ctx.value;
  if (Object.keys(records).length === 0) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: "Ponder Indexing Status must include at least one indexed chain.",
    });
  }
}

/**
 * Schema describing response at `GET /status`.
 */
export const schemaSerializedPonderIndexingStatus = z
  .record(schemaSerializedChainName, schemaSerializedChainBlockRef)
  .check(invariant_includesAtLeastOneIndexedChain);

/**
 * Serialized Ponder Indexing Status.
 */
export type SerializedPonderIndexingStatus = z.infer<typeof schemaSerializedPonderIndexingStatus>;

/**
 * Ponder Indexing Status
 *
 * Represents chains indexing status in Ponder application.
 */
export interface PonderIndexingStatus {
  /**
   * Map of indexed chain IDs to their block reference.
   *
   * Guarantees:
   * - Includes entry for at least one indexed chain.
   * - BlockRef corresponds to either:
   *   - The first block to be indexed (when chain indexing is currently queued).
   *   - The last indexed block (when chain indexing is currently in progress).
   */
  chains: Map<ChainId, BlockRef>;
}

/**
 * Build Ponder Indexing Status
 *
 * @param data Validated serialized Ponder Indexing Status.
 * @returns Ponder Indexing Status.
 */
function buildPonderIndexingStatus(data: SerializedPonderIndexingStatus): PonderIndexingStatus {
  const chains = new Map<ChainId, BlockRef>();

  for (const [, chainData] of Object.entries(data)) {
    chains.set(chainData.id, chainData.block);
  }

  return {
    chains,
  };
}

/**
 * Deserialize Ponder Indexing Status.
 *
 * @param response Maybe unvalidated Ponder Indexing Status.
 * @returns Ponder Indexing Status.
 * @throws Error if response is invalid.
 */
export function deserializePonderIndexingStatus(response: unknown): PonderIndexingStatus {
  const validation = schemaSerializedPonderIndexingStatus.safeParse(response);

  if (!validation.success) {
    throw new Error(
      `Invalid serialized Ponder Indexing Status: ${prettifyError(validation.error)}`,
    );
  }

  return buildPonderIndexingStatus(validation.data);
}
