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

import { DB_SCHEMA_VERSION } from "@/lib/database";
import type { ENSRainbowServer } from "@/lib/server";
import { getErrorMessage } from "@/utils/error-utils";
import { logger } from "@/utils/logger";

/**
 * Validate that the ENSRainbowServer has been successfully initialized in the context.
 * @param c - The Hono context to validate.
 *
 * @throws {Error} If the ENSRainbowServer initialization failed.
 */
export function validateEnsRainbowServerContextVariable(
  c: HonoContext,
): asserts c is HonoContext<{ Variables: { ensRainbowServer: ENSRainbowServer } }> {
  if (typeof c.var.ensRainbowServer === "undefined") {
    throw new Error(
      "Invariant: ensRainbowServerMiddleware is required to initialize the ENSRainbowServer",
    );
  }

  if (c.var.ensRainbowServer instanceof Error) {
    throw new Error(
      `ENSRainbowServer initialization failed: ${getErrorMessage(c.var.ensRainbowServer)}`,
    );
  }
}

const apiV1 = new Hono();

// Enable CORS for all versioned API routes
apiV1.use(
  "*",
  cors({
    // Allow all origins
    origin: "*",
    // ENSRainbow API is read-only, so only allow read methods
    allowMethods: ["HEAD", "GET", "OPTIONS"],
  }),
);

apiV1.get("/heal/:labelhash", async (c) => {
  validateEnsRainbowServerContextVariable(c);

  const server = c.var.ensRainbowServer;
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

  logger.debug(
    `Healing request for labelhash: ${labelhash}, with labelSet: ${JSON.stringify(clientLabelSet)}`,
  );
  const result = await server.heal(labelhash, clientLabelSet);
  logger.debug(result, `Heal result:`);
  return c.json(result, result.errorCode);
});

apiV1.get("/labels/count", async (c) => {
  validateEnsRainbowServerContextVariable(c);

  const server = c.var.ensRainbowServer;
  logger.debug("Label count request");
  const result = await server.labelCount();
  logger.debug(result, `Count result`);
  return c.json(result, result.errorCode);
});

apiV1.get("/version", (c) => {
  validateEnsRainbowServerContextVariable(c);

  const server = c.var.ensRainbowServer;
  logger.debug("Version request");
  const result: EnsRainbow.VersionResponse = {
    status: StatusCode.Success,
    versionInfo: {
      version: packageJson.version,
      dbSchemaVersion: DB_SCHEMA_VERSION,
      labelSet: server.getServerLabelSet(),
    },
  };
  logger.debug(result, `Version result`);
  return c.json(result);
});

export default apiV1;
