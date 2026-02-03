import { z } from "zod/v4";

import { nonnegativeIntegerSchema } from "./numbers";
import { unixTimestampSchema } from "./time";

//// Block Number

export const blockNumberSchema = nonnegativeIntegerSchema;

/**
 * Block Number
 *
 * Guaranteed to be a non-negative integer.
 */
export type BlockNumber = z.infer<typeof blockNumberSchema>;

export const blockRefSchema = z.object({
  number: blockNumberSchema,
  timestamp: unixTimestampSchema,
});

/**
 * BlockRef
 *
 * Describes a single block.
 */
export type BlockRef = z.infer<typeof blockRefSchema>;
