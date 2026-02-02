import packageJson from "@/../package.json";

import type { Context as HonoContext } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";

import {
  buildEnsRainbowClientLabelSet,
  buildLabelSetId,
  buildLabelSetVersion,
  type EnsRainbowClientLabelSet,
  type LabelSetId,
  type LabelSetVersion,
} from "@ensnode/ensnode-sdk";
import { type EnsRainbow, ErrorCode, StatusCode } from "@ensnode/ensrainbow-sdk";

import { buildENSRainbowPublicConfig } from "@/config/config.schema";
import { DB_SCHEMA_VERSION, type ENSRainbowDB } from "@/lib/database";
import { ENSRainbowServer } from "@/lib/server";
import { getErrorMessage } from "@/utils/error-utils";
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
    } catch (_error) {
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
          error: getErrorMessage(error),
          errorCode: ErrorCode.BadRequest,
        },
        400,
      );
    }

    const result = await server.heal(labelhash, clientLabelSet);
    return c.json(result, result.errorCode);
  });

  api.get("/health", (c: HonoContext) => {
    const result: EnsRainbow.HealthResponse = { status: "ok" };
    return c.json(result);
  });

  api.get("/v1/labels/count", async (c: HonoContext) => {
    const result = await server.labelCount();
    return c.json(result, result.errorCode);
  });

  api.get("/v1/config", async (c: HonoContext) => {
    const countResult = await server.labelCount();
    if (countResult.status === StatusCode.Error) {
      logger.error("Failed to get records count for config endpoint");
      return c.json(
        {
          status: StatusCode.Error,
          error: countResult.error,
          errorCode: countResult.errorCode,
        },
        500,
      );
    }

    const publicConfig = buildENSRainbowPublicConfig(server.getServerLabelSet(), countResult.count);
    return c.json(publicConfig);
  });

  /**
   * @deprecated Use GET /v1/config instead. This endpoint will be removed in a future version.
   */
  api.get("/v1/version", (c: HonoContext) => {
    const result: EnsRainbow.VersionResponse = {
      status: StatusCode.Success,
      versionInfo: {
        version: packageJson.version,
        dbSchemaVersion: DB_SCHEMA_VERSION,
        labelSet: server.getServerLabelSet(),
      },
    };
    return c.json(result);
  });

  return api;
}
