import type { z } from "zod/v4";

import { nonnegativeIntegerSchema } from "./shared";

//// Block Number

export const blockNumberSchema = nonnegativeIntegerSchema;

/**
 * Block Number
 *
 * Guaranteed to be a non-negative integer.
 */
export type BlockNumber = z.infer<typeof blockNumberSchema>;

// Chain ID

export const chainIdSchema = nonnegativeIntegerSchema;

/**
 * Chain ID
 *
 * Represents a unique identifier for a chain.
 * Guaranteed to be a positive integer.
 *
 * Chain id standards are organized by the Ethereum Community @ https://github.com/ethereum-lists/chains
 **/
export type ChainId = z.infer<typeof chainIdSchema>;
