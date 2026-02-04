import type { z } from "zod/v4";

import { positiveIntegerSchema } from "./numbers";

// Chain ID

export const chainIdSchema = positiveIntegerSchema;

/**
 * Chain ID
 *
 * Represents a unique identifier for a chain.
 * Guaranteed to be a positive integer.
 *
 * Chain id standards are organized by the Ethereum Community @ https://github.com/ethereum-lists/chains
 **/
export type ChainId = z.infer<typeof chainIdSchema>;
