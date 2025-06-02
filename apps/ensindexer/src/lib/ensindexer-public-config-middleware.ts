import { buildPublicConfig } from "@/config/config.schema";
import type { ENSIndexerConfig } from "@/config/types";
import { jsonStringifyReplacer } from "@ensnode/ensnode-sdk";
import type { Context } from "hono";

/**
 * Middleware for sharing ENSIndexer public config with clients.
 */
export function createEnsIndexerPublicConfigMiddleware(config: ENSIndexerConfig) {
  return async function ensIndexerPublicConfigMiddleware(c: Context) {
    const publicConfig = buildPublicConfig(config);

    // stringify publicConfig object with safe jsonStringifyReplacer handler
    const publicConfigStringified = JSON.stringify(publicConfig, jsonStringifyReplacer);

    // make the client aware of JSON-formatted response
    c.header("Content-Type", "application/json");
    return c.text(publicConfigStringified);
  };
}
