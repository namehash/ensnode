import type { ContentfulStatusCode } from "hono/utils/http-status";

import { type EnsRainbow, StatusCode } from "@ensnode/ensrainbow-sdk";

import apiV1 from "@/lib/api.v1";
import type { ENSRainbowDB } from "@/lib/database";
import { factory } from "@/lib/hono-factory";
import { ensRainbowServerMiddleware } from "@/lib/middleware/ensrainbow-server.middleware";
import { logger } from "@/utils/logger";

export type Api = ReturnType<typeof factory.createApp>;

/**
 * Creates and configures an ENS Rainbow api
 */
export function createApi(db: ENSRainbowDB): Api {
  const api = factory.createApp();

  // Apply ENSRainbowServer middleware to all routes
  api.use(ensRainbowServerMiddleware(db));

  api.get("/health", (c) => {
    logger.debug("Health check request");
    const result: EnsRainbow.HealthResponse = { status: StatusCode.Success };
    return c.json(result);
  });

  api.get("/ready", (c) => {
    logger.debug("Readiness check request");

    const isReady =
      typeof c.var.ensRainbowServer !== "undefined" && !(c.var.ensRainbowServer instanceof Error);

    console.log("Readiness check - isReady:", isReady);

    let result: EnsRainbow.ReadyResponse;
    let statusCode: ContentfulStatusCode;

    if (isReady) {
      result = { status: StatusCode.Success } satisfies EnsRainbow.ReadyResponse;
      statusCode = 200;
    } else {
      result = { status: StatusCode.Error } satisfies EnsRainbow.ReadyResponse;
      statusCode = 503;
    }

    return c.json(result, statusCode);
  });

  // Mount versioned API routes
  api.route("/v1", apiV1);

  return api;
}
