import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";
import { StatusCode } from "@ensnode/ensrainbow-sdk";
import { Hono } from "hono";
import type { Context as HonoContext } from "hono";
import { cors } from "hono/cors";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { logger } from "../utils/logger";
import packageJson from "@/../package.json";
import { ENSRainbowDB, SCHEMA_VERSION } from "./database";
import { ENSRainbowServer } from "./server";

/**
 * Creates and configures an ENS Rainbow api
 */
export async function createApi(db: ENSRainbowDB): Promise<Hono> {
  const api = new Hono();
  const server = await ENSRainbowServer.init(db);

  // Enable CORS for all versioned API routes
  api.use(
    "/v1/*",
    cors({
      // Allow all origins
      origin: "*",
      // ENSRainbow API is read-only, so only allow read methods
      allowMethods: ["HEAD", "GET", "OPTIONS"],
    }),
  );

  api.get("/v1/heal/:labelhash", async (c: HonoContext) => {
    const labelhash = c.req.param("labelhash") as `0x${string}`;
    logger.debug(`Healing request for labelhash: ${labelhash}`);
    const result = await server.heal(labelhash);
    logger.debug(`Heal result:`, result);

    // Map error codes > 1000 to 500, otherwise use the original code
    const statusCode = result.errorCode && result.errorCode >= 1000 ? 500 : result.errorCode;

    return c.json(result, statusCode as ContentfulStatusCode);
  });

  api.get("/health", (c: HonoContext) => {
    logger.debug("Health check request");
    const result: EnsRainbow.HealthResponse = { status: "ok" };
    return c.json(result);
  });

  api.get("/v1/labels/count", async (c: HonoContext) => {
    logger.debug("Label count request");
    const result = await server.labelCount();
    logger.debug(`Count result:`, result);

    // Map error codes > 1000 to 500, otherwise use the original code
    const statusCode = result.errorCode && result.errorCode >= 1000 ? 500 : result.errorCode;

    return c.json(result, statusCode as ContentfulStatusCode);
  });

  api.get("/v1/version", (c: HonoContext) => {
    logger.debug("Version request");
    const result: EnsRainbow.VersionResponse = {
      status: StatusCode.Success,
      versionInfo: {
        version: packageJson.version,
        schema_version: SCHEMA_VERSION,
      },
    };
    logger.debug(`Version result:`, result);
    return c.json(result);
  });

  return api;
}
