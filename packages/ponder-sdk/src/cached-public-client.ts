import type { PublicClient } from "viem";

/**
 * Cached Public Client
 *
 * Represents a public client that uses caching to optimize RPC data access.
 *
 * @see https://ponder.sh/docs/indexing/read-contracts#client
 */
export interface CachedPublicClient extends PublicClient {}
