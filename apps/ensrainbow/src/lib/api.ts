import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";
import { ErrorCode, StatusCode } from "@ensnode/ensrainbow-sdk";
import { Hono } from "hono";
import type { Context as HonoContext } from "hono";
import { cors } from "hono/cors";

import packageJson from "@/../package.json";
import { ENSRainbowDB, SCHEMA_VERSION, parseNonNegativeInteger } from "@/lib/database";
import { ENSRainbowServer } from "@/lib/server";
import { logger } from "@/utils/logger";

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

    // Parse the highest_label_set from query string if provided
    const highestLabelSetParam = c.req.query("label_set");
    const namespaceParam = c.req.query("namespace");

    // Both parameters must be provided together or neither should be provided
    if ((highestLabelSetParam === undefined) !== (namespaceParam === undefined)) {
      logger.warn(
        `Invalid parameters: both 'label_set' and 'namespace' must be provided together or neither should be provided`,
      );
      return c.json(
        {
          status: StatusCode.Error,
          error: "Invalid parameters: both 'label_set' and 'namespace' must be provided together",
          errorCode: ErrorCode.BadRequest,
        },
        400,
      );
    }

    let labelSet: number | undefined = undefined;
    let namespace: string | undefined = undefined;

    if (highestLabelSetParam !== undefined && namespaceParam !== undefined) {
      try {
        labelSet = parseNonNegativeInteger(highestLabelSetParam);
        namespace = namespaceParam;
      } catch (error) {
        logger.warn(`Invalid label_set parameter: ${highestLabelSetParam}`);
        return c.json(
          {
            status: StatusCode.Error,
            error: "Invalid label_set parameter: must be a non-negative integer",
            errorCode: ErrorCode.BadRequest,
          },
          400,
        );
      }
    }

    logger.debug(
      `Healing request for labelhash: ${labelhash}, label_set: ${labelSet}, namespace: ${namespace}`,
    );
    const result = await server.heal(labelhash, labelSet, namespace);
    logger.debug(`Heal result:`, result);
    return c.json(result, result.errorCode);
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
    return c.json(result, result.errorCode);
  });

  api.get("/v1/version", (c: HonoContext) => {
    logger.debug("Version request");
    const result: EnsRainbow.VersionResponse = {
      status: StatusCode.Success,
      versionInfo: {
        version: packageJson.version,
        schema_version: SCHEMA_VERSION,
        namespace: server.getNamespace(),
        highest_label_set: server.getHighestLabelSet(),
      },
    };
    logger.debug(`Version result:`, result);
    return c.json(result);
  });

  return api;
}
