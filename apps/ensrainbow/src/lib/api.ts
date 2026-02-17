import packageJson from "@/../package.json" with { type: "json" };

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

import { DB_SCHEMA_VERSION } from "@/lib/database";
import type { ENSRainbowServer } from "@/lib/server";
import { getErrorMessage } from "@/utils/error-utils";
import { logger } from "@/utils/logger";

/**
 * Creates and configures the ENS Rainbow API routes.
 */
export function createApi(
  server: ENSRainbowServer,
  publicConfig: EnsRainbow.ENSRainbowPublicConfig,
): Hono {
  const api = new Hono();

  const countResponse: EnsRainbow.CountSuccess = {
    status: StatusCode.Success,
    count: publicConfig.recordsCount,
    timestamp: new Date().toISOString(),
  };

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

  api.get("/v1/labels/count", (c: HonoContext) => {
    return c.json(countResponse);
  });

  api.get("/v1/config", (c: HonoContext) => {
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
