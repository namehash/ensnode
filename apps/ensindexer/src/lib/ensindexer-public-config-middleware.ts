import { intoPublicConfig } from "@/config/config.schema";
import type { ENSIndexerConfig } from "@/config/types";
import type { Context } from "hono";

/**
 * Middleware for sharing ENSIndexer public config with clients.
 */
export function createEnsIndexerPublicConfigMiddleware(config: ENSIndexerConfig) {
  return async function ensIndexerPublicConfigMiddleware(context: Context) {
    // TODO: ensure the public config value can be safely serialized into JSON
    // For example, test public config including bigint values, and functions.
    return context.json(intoPublicConfig(config));
  };
}
