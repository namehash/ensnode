/**
 * Ponder Status
 *
 * Defines the structure and validation for the Ponder status response.
 * @see https://ponder.sh/docs/advanced/observability#indexing-status
 */

import { prettifyError, z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { blockRefSchema } from "./block-ref";
import { type ChainId, chainIdSchema } from "./chain";

const ponderStatusChainNameSchema = z.string();

const ponderStatusChainSchema = z.object({
  id: chainIdSchema,
  block: blockRefSchema,
});

export type PonderStatusChain = z.infer<typeof ponderStatusChainSchema>;

/**
 * Schema for validating raw response from Ponder Status endpoint at `GET /status`.
 */
const ponderStatusResponseSchema = z.record(ponderStatusChainNameSchema, ponderStatusChainSchema);

/**
 * Validated Ponder Status response.
 */
export type PonderStatusResponse = z.infer<typeof ponderStatusResponseSchema>;

function invariant_includesStatusForEachIndexedChainId(
  ctx: ParsePayload<PonderStatusResponse>,
  indexedChainIds: Set<ChainId>,
) {
  const ponderStatusChainIds = new Set(Object.values(ctx.value).map((chain) => chain.id));

  if (!indexedChainIds.isSubsetOf(ponderStatusChainIds)) {
    const missingIndexedChainIds = [...indexedChainIds].filter(
      (id) => !ponderStatusChainIds.has(id),
    );
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `Ponder Status response is missing status for indexed chain IDs: ${missingIndexedChainIds.join(", ")}`,
    });
  }
}

/**
 * Validate Ponder Status response.
 *
 * @param response Unvalidated Ponder status response.
 * @param indexedChainIds Set of chain IDs that are indexed by the Ponder instance.
 * @returns Validated Ponder status response.
 * @throws Error if response is invalid or invariants check fails.
 */
export function validatePonderStatusResponse(
  response: unknown,
  indexedChainIds: Set<ChainId>,
): PonderStatusResponse {
  const validation = ponderStatusResponseSchema
    .check((ctx) => invariant_includesStatusForEachIndexedChainId(ctx, indexedChainIds))
    .safeParse(response);

  if (!validation.success) {
    throw new Error(`Invalid Ponder status response: ${prettifyError(validation.error)}`);
  }

  return validation.data;
}
