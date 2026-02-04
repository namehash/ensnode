/**
 * Ponder Indexing Status
 *
 * Defines the structure and validation for the Ponder Indexing Status response
 * from `GET /status` endpoint.
 * @see https://ponder.sh/docs/advanced/observability#indexing-status
 */

import { prettifyError, z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import type { BlockRef } from "../blocks";
import { blockRefSchema } from "../blocks";
import type { ChainId } from "../chains";
import { chainIdSchema } from "../chains";
import type { PonderIndexingStatus } from "../indexing-status";

const schemaSerializedChainName = z.string();

const schemaSerializedChainBlockRef = z.object({
  id: chainIdSchema,
  block: blockRefSchema,
});

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
 * Schema describing the response of fetching `GET /status` from a Ponder app.
 */
const schemaSerializedPonderIndexingStatus = z
  .record(schemaSerializedChainName, schemaSerializedChainBlockRef)
  .check(invariant_includesAtLeastOneIndexedChain);

/**
 * Serialized Ponder Indexing Status.
 */
export type SerializedPonderIndexingStatus = z.infer<typeof schemaSerializedPonderIndexingStatus>;

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
 * Deserialize and validate a Serialized Ponder Indexing Status.
 *
 * @param data Maybe a Serialized Ponder Indexing Status.
 * @returns Deserialized and validated Ponder Indexing Status.
 * @throws Error if data cannot be deserialized into a valid Ponder Indexing Status.
 */
export function deserializePonderIndexingStatus(
  data: SerializedPonderIndexingStatus | unknown,
): PonderIndexingStatus {
  const validation = schemaSerializedPonderIndexingStatus.safeParse(data);

  if (!validation.success) {
    throw new Error(
      `Invalid serialized Ponder Indexing Status: ${prettifyError(validation.error)}`,
    );
  }

  return buildPonderIndexingStatus(validation.data);
}
