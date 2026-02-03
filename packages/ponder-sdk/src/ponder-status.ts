/**
 * Ponder Status
 *
 * Defines the structure and validation for the Ponder status response.
 * @see https://ponder.sh/docs/advanced/observability#indexing-status
 */

import { prettifyError, z } from "zod/v4";

import { blockRefSchema } from "./block-ref";
import { chainIdSchema } from "./chain";

const ponderStatusChainNameSchema = z.string();

const ponderStatusChainSchema = z.object({
  id: chainIdSchema,
  block: blockRefSchema,
});

const ponderStatusResponseSchema = z.record(ponderStatusChainNameSchema, ponderStatusChainSchema);

/**
 * Get validated Ponder status response.
 *
 * @param response Unvalidated Ponder status response.
 * @returns Validated Ponder status response.
 * @throws Error if the response is invalid.
 */
export function parsePonderStatusResponse(response: unknown) {
  const parsedResponse = ponderStatusResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new Error(`Invalid Ponder status response: ${prettifyError(parsedResponse.error)}`);
  }

  return parsedResponse.data;
}

export type PonderStatusResponse = z.infer<typeof ponderStatusResponseSchema>;
