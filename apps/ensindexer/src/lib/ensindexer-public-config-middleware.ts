import config from "@/config";
import { intoPublicConfig } from "@/config/config.schema";
import type { Context } from "hono";

/**
 * Middleware for sharing ENSIndexer public config with clients.
 */
export const ensIndexerPublicConfigMiddleware = async function (context: Context) {
  return context.json(intoPublicConfig(config));
};
