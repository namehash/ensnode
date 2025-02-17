import type { HealthResponse } from "@ensnode/ensrainbow-sdk/types";
import { Hono } from "hono";
import type { Context as HonoContext } from "hono";
import { logger } from "../utils/logger";
import { ENSRainbowDB } from "./database";
import { ENSRainbowServer } from "./server";

/**
 * Creates and configures the ENS Rainbow server routes
 */
export async function createRoutes(db: ENSRainbowDB): Promise<Hono> {
  const app = new Hono();
  const rainbow = await ENSRainbowServer.init(db);

  app.get("/v1/heal/:labelhash", async (c: HonoContext) => {
    const labelhash = c.req.param("labelhash") as `0x${string}`;
    logger.debug(`Healing request for labelhash: ${labelhash}`);
    const result = await rainbow.heal(labelhash);
    logger.debug(`Heal result:`, result);
    return c.json(result, result.errorCode);
  });

  app.get("/health", (c: HonoContext) => {
    logger.debug("Health check request");
    const result: HealthResponse = { status: "ok" };
    return c.json(result);
  });

  app.get("/v1/labels/count", async (c: HonoContext) => {
    logger.debug("Label count request");
    const result = await rainbow.labelCount();
    logger.debug(`Count result:`, result);
    return c.json(result, result.errorCode);
  });

  return app;
}
