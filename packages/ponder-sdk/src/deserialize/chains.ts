import { prettifyError, z } from "zod/v4";

import type { ChainId } from "../chains";
import { positiveIntegerSchema } from "../numbers";

export const chainIdSchema = positiveIntegerSchema;

type ChainIdString = string;

const chainIdStringSchema = z
  .string({ error: `Value must be a string representing a chain ID.` })
  .pipe(z.coerce.number({ error: `Value must represent a positive integer (>0).` }))
  .pipe(chainIdSchema);

/**
 * Deserialize Chain ID from String
 *
 * Attempts to deserialize a Chain ID from a string representation.
 */
export function deserializeChainIdString(maybeChainId: ChainIdString | unknown): ChainId {
  const parsed = chainIdStringSchema.safeParse(maybeChainId);

  if (parsed.error) {
    throw new Error(`Cannot deserialize ChainId:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
