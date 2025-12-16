/**
 * Schema Definitions that hold metadata about the ENSNode instance.
 */

import { onchainTable } from "ponder";

export const ensNodeMetadata = onchainTable("ensnode_metadata", (t) => ({
  /**
   * Key
   */
  key: t.text().primaryKey(),

  /**
   * Value
   *
   * Guaranteed to be a JSON object.
   */
  value: t.jsonb().notNull(),
}));
