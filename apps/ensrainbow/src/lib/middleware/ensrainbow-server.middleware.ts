import type { ENSRainbowDB } from "@/lib/database";
import { factory } from "@/lib/hono-factory";
import { ENSRainbowServer } from "@/lib/server";
import { getErrorMessage } from "@/utils/error-utils";

/**
 * Type definition for the ENSRainbow server middleware context passed to downstream middleware and handlers.
 */
export type EnsRainbowServerMiddlewareVariables = {
  /**
   * ENSRainbowServer can be either
   * - a successfully initialized server instance,
   * - an Error if initialization failed.
   */
  ensRainbowServer: ENSRainbowServer | Error;
};

/**
 * ENSRainbowServer instance.
 *
 * Initialized once and reused for all requests.
 */
let ensRainbowServerInstance: ENSRainbowServer;

/**
 * Middleware that provides {@link EnsRainbowServerMiddlewareVariables}
 * to downstream middleware and handlers.
 */
export const ensRainbowServerMiddleware = (db: ENSRainbowDB) =>
  factory.createMiddleware(async (c, next) => {
    try {
      // Initialize the ENSRainbowServer instance just once
      if (!ensRainbowServerInstance) {
        ensRainbowServerInstance = await ENSRainbowServer.init(db);
      }

      c.set("ensRainbowServer", ensRainbowServerInstance);
    } catch (error) {
      c.set(
        "ensRainbowServer",
        new Error(`Failed to initialize ENSRainbowServer with database: ${getErrorMessage(error)}`),
      );
    }

    return await next();
  });
