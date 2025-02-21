import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";
import { Hono } from "hono";
import type { Context as HonoContext } from "hono";
import { logger } from "../utils/logger";
import { ENSRainbowDB } from "./database";
import { ENSRainbowServer } from "./server";

/**
 * Creates and configures an ENS Rainbow api
 */
export async function createApi(db: ENSRainbowDB): Promise<Hono> {
  const api = new Hono();
  const server = await ENSRainbowServer.init(db);

  api.get("/v1/heal/:labelhash", async (c: HonoContext) => {
    const labelhash = c.req.param("labelhash") as `0x${string}`;
    logger.debug(`Healing request for labelhash: ${labelhash}`);
    const result = await server.heal(labelhash);
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

  return api;
}
