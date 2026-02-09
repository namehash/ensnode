import { z } from "zod/v4";

import { schemaNonnegativeInteger } from "./numbers";
import { schemaUnixTimestamp } from "./time";

//// Block Number

export const schemaBlockNumber = schemaNonnegativeInteger;

/**
 * Block Number
 *
 * Guaranteed to be a non-negative integer.
 */
export type BlockNumber = z.infer<typeof schemaBlockNumber>;

export const schemaBlockRef = z.object({
  number: schemaBlockNumber,
  timestamp: schemaUnixTimestamp,
});

/**
 * BlockRef
 *
 * Reference to a block.
 */
export type BlockRef = z.infer<typeof schemaBlockRef>;
