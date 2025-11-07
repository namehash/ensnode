import type { z } from "zod/v4";

import type { UrlString } from "../serialized-types";
import type { ChainId } from "../types";
import type {
  DatabaseSchemaNameSchema,
  EnsIndexerUrlSchema,
  TheGraphApiKeySchema,
} from "./zod-schemas";

/**
 * RPC configuration for a single chain.
 *
 * Ponder automatically manages the use of RPC endpoints for each indexed chain.
 *
 * @see https://ponder.sh/docs/config/chains#rpc-endpoints
 * @see https://ponder.sh/docs/config/chains#websocket
 */
export interface RpcConfig {
  /**
   * The HTTP protocol URLs for RPCs to the chain (ex: "https://eth-mainnet.g.alchemy.com/v2/...").
   * For proper indexing behavior, each RPC must support high request rate limits (ex: 500+ requests a second).
   *
   * The order of RPC URLs matters. The first HTTP/HTTPS RPC for a given chain
   * will be the RPC that is used for Resolution API request processing.
   *
   * Invariants:
   * - Includes one or more URLs.
   * - Each URL in the array is guaranteed to be distinct.
   * - The protocol of each URL is guaranteed to be "http" or "https".
   */
  httpRPCs: [URL, ...URL[]];

  /**
   * The websocket RPC for the chain.
   *
   * If defined, it is used to accelerate discovery of new "realtime" blocks.
   *
   * Invariants:
   * - If defined, the protocol of the URL is guaranteed to be "ws" or "wss".
   */
  websocketRPC?: URL;
}

export type RpcConfigs = Map<ChainId, RpcConfig>;

export type DatabaseUrl = UrlString;
export type DatabaseSchemaName = z.infer<typeof DatabaseSchemaNameSchema>;
export type EnsIndexerUrl = z.infer<typeof EnsIndexerUrlSchema>;
export type TheGraphApiKey = z.infer<typeof TheGraphApiKeySchema>;
