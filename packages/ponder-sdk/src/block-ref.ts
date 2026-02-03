import { z } from "zod/v4";

import { blockNumberSchema } from "./chain";
import { unixTimestampSchema } from "./shared";

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
