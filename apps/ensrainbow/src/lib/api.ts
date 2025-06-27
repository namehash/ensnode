import {
  type EnsRainbow,
  EnsRainbowClientLabelSet,
  ErrorCode,
  type LabelSetId,
  type LabelSetVersion,
  StatusCode,
  buildEnsRainbowClientLabelSet,
  buildLabelSetId,
  buildLabelSetVersion,
} from "@ensnode/ensrainbow-sdk";
import { Hono } from "hono";
import type { Context as HonoContext } from "hono";
import { cors } from "hono/cors";

import packageJson from "@/../package.json";
import { DB_SCHEMA_VERSION, ENSRainbowDB } from "@/lib/database";
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

    const labelSetVersionParam = c.req.query("label_set_version");
    const labelSetIdParam = c.req.query("label_set_id");

    let labelSetVersion: LabelSetVersion | undefined;
    try {
      if (labelSetVersionParam) {
        labelSetVersion = buildLabelSetVersion(labelSetVersionParam);
      }
    } catch (error) {
      logger.warn(`Invalid label_set_version parameter: ${labelSetVersionParam}`);
      return c.json(
        {
          status: StatusCode.Error,
          error: "Invalid label_set_version parameter: must be a non-negative integer",
          errorCode: ErrorCode.BadRequest,
        },
        400,
      );
    }

    let clientLabelSet: EnsRainbowClientLabelSet;
    try {
      const labelSetId: LabelSetId | undefined = labelSetIdParam
        ? buildLabelSetId(labelSetIdParam)
        : undefined;
      clientLabelSet = buildEnsRainbowClientLabelSet(labelSetId, labelSetVersion);
    } catch (error) {
      logger.warn(error);
      return c.json(
        {
          status: StatusCode.Error,
          error: error instanceof Error ? error.message : "An unknown error occurred",
          errorCode: ErrorCode.BadRequest,
        },
        400,
      );
    }

    logger.debug(
      `Healing request for labelhash: ${labelhash}, with labelSet: ${JSON.stringify(
        clientLabelSet,
      )}`,
    );
    const result = await server.heal(labelhash, clientLabelSet);
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
        schemaVersion: DB_SCHEMA_VERSION,
        labelSet: {
          labelSetId: server.serverLabelSet.labelSetId,
          highestLabelSetVersion: server.serverLabelSet.highestLabelSetVersion,
        },
      },
    };
    logger.debug(`Version result:`, result);
    return c.json(result);
  });

  return api;
}
