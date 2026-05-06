import { z } from "zod/v4";

import { OptionalPortNumberSchema } from "@ensnode/ensnode-sdk/internal";

/**
 * Default port for EnsRainbowBeam. Used when `PORT` env var is unset.
 */
export const ENSRAINBOWBEAM_DEFAULT_PORT = 4444;

const ConfigSchema = z.object({
  PORT: OptionalPortNumberSchema.default(ENSRAINBOWBEAM_DEFAULT_PORT),
  ENSNODE_URL: z.string().url(),
});

const parsed = ConfigSchema.parse(process.env);

/**
 * Process configuration parsed from `process.env` at module load.
 *
 * Throws (via Zod) if any required env var is missing or invalid.
 */
export const config = {
  port: parsed.PORT,
  ensNodeUrl: parsed.ENSNODE_URL,
};

export type Config = typeof config;
