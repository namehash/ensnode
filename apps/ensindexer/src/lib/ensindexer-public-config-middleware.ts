import { buildPublicConfig } from "@/config/config.schema";
import type { ENSIndexerConfig } from "@/config/types";
import type { Context } from "hono";

/**
 * Middleware for sharing ENSIndexer public config with clients.
 */
export function createEnsIndexerPublicConfigMiddleware(config: ENSIndexerConfig) {
  return async function ensIndexerPublicConfigMiddleware(c: Context) {
    const publicConfig = buildPublicConfig(config);

    // TODO: ensure the public config value can be safely serialized into JSON
    // For example, public config may include bigint values, and functions.
    const serializedPublicConfig = JSON.stringify(publicConfig);

    c.header("Content-Type", "application/json");
    return c.body(serializedPublicConfig);
  };
}
