import config from "@/config";

import { factory } from "@/lib/hono-factory";

/**
 * Path to the OpenAPI spec endpoint - the only route accessible in OpenAPI generate mode.
 */
const OPENAPI_SPEC_PATH = "/openapi.json";

/**
 * Middleware that blocks all routes except `/openapi.json` when ENSApi is running
 * in OpenAPI generate mode (OPENAPI_GENERATE_MODE=true).
 *
 * When blocked, returns HTTP 503 Service Unavailable with a JSON error message
 * explaining that ENSApi is running in OpenAPI generate mode.
 *
 * This middleware should be registered early in the middleware chain, before
 * other middleware that may attempt to access external resources (database,
 * ENSIndexer, RPC endpoints, etc.).
 */
export const openApiGenerateModeMiddleware = factory.createMiddleware(async (c, next) => {
  if (config.inOpenApiGenerateMode && c.req.path !== OPENAPI_SPEC_PATH) {
    return c.json(
      {
        error: "Service Unavailable",
        message: `ENSApi is running in OpenAPI generate mode. Only the ${OPENAPI_SPEC_PATH} endpoint is available.`,
      },
      503,
    );
  }

  return next();
});
