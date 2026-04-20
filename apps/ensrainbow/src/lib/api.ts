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

import { DbNotReadyError, type ENSRainbowServer } from "@/lib/server";
import { getErrorMessage } from "@/utils/error-utils";
import { logger } from "@/utils/logger";

/**
 * Supplier of the current public config for the API.
 *
 * Returns `null` while the server is still bootstrapping its database. Once the database is
 * attached, the supplier returns the final `ENSRainbowPublicConfig` (cached by the caller).
 */
export type PublicConfigSupplier = () => EnsRainbow.ENSRainbowPublicConfig | null;

/**
 * Shared 503 response body for endpoints that require the database to be ready.
 */
const BOOTSTRAPPING_MESSAGE = "ENSRainbow is still bootstrapping its database";

function buildServiceUnavailableBody(
  message: string = BOOTSTRAPPING_MESSAGE,
): EnsRainbow.ServiceUnavailableError {
  return {
    status: StatusCode.Error,
    error: message,
    errorCode: ErrorCode.ServiceUnavailable,
  };
}

/**
 * Creates and configures the ENS Rainbow API routes.
 *
 * When `publicConfigSupplier` returns `null`, routes that depend on the database respond with
 * HTTP 503 so that clients polling `/ready` can wait for the bootstrap to complete.
 */
export function createApi(
  server: ENSRainbowServer,
  publicConfigSupplier: PublicConfigSupplier,
): Hono {
  const api = new Hono();

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
    if (!server.isReady()) {
      return c.json(buildServiceUnavailableBody(), ErrorCode.ServiceUnavailable);
    }

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

    try {
      const result = await server.heal(labelhash, clientLabelSet);
      return c.json(result, result.errorCode);
    } catch (error) {
      // Handles the race where isReady() was true at route entry but the server transitioned
      // out of ready (e.g. during shutdown).
      if (error instanceof DbNotReadyError) {
        return c.json(buildServiceUnavailableBody(), ErrorCode.ServiceUnavailable);
      }
      throw error;
    }
  });

  api.get("/health", (c: HonoContext) => {
    const result: EnsRainbow.HealthResponse = { status: "ok" };
    return c.json(result);
  });

  api.get("/ready", (c: HonoContext) => {
    if (!server.isReady()) {
      return c.json(buildServiceUnavailableBody(), ErrorCode.ServiceUnavailable);
    }
    const result: EnsRainbow.ReadyResponse = { status: "ok" };
    return c.json(result);
  });

  api.get("/v1/labels/count", (c: HonoContext) => {
    const publicConfig = publicConfigSupplier();
    if (publicConfig === null) {
      return c.json(buildServiceUnavailableBody(), ErrorCode.ServiceUnavailable);
    }

    const countResponse: EnsRainbow.CountSuccess = {
      status: StatusCode.Success,
      count: publicConfig.recordsCount,
      timestamp: new Date().toISOString(),
    };
    return c.json(countResponse);
  });

  api.get("/v1/config", (c: HonoContext) => {
    const publicConfig = publicConfigSupplier();
    if (publicConfig === null) {
      return c.json(buildServiceUnavailableBody(), ErrorCode.ServiceUnavailable);
    }
    return c.json(publicConfig);
  });

  return api;
}
