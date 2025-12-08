import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export type Schema = { [name: string]: unknown };

export type Drizzle<TSchema extends Schema = Schema> = NodePgDatabase<TSchema>;

interface SubgraphMetaBlockInfo {
  /** Block number */
  number: number;

  /** Block unix timestamp */
  timestamp: number;

  /** Block hash */
  hash: `0x${string}` | null;

  /** Block parent hash */
  parentHash: `0x${string}` | null;
}

/**
 * The metadata provider interface used to fetch data from the application layer.
 */
export interface _SubgraphMeta {
  /**
   * Unique ID to be used as a deployment ID in `_meta.deployment`.
   */
  deployment: string;

  /**
   * Get last indexed block status
   * @returns The last indexed block status
   */
  block: SubgraphMetaBlockInfo;

  /**
   * Get the indexing errors status
   * @returns The indexing errors status
   */
  hasIndexingErrors: boolean;
}

export type SubgraphMeta = null | _SubgraphMeta;

/**
 * Hono Variables type for Subgraph _meta Support
 */
export type SubgraphMetaVariables = {
  _meta: SubgraphMeta | undefined;
};
