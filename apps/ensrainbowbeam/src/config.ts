import { z } from "zod/v4";

import { OptionalPortNumberSchema } from "@ensnode/ensnode-sdk/internal";

/**
 * Default port for EnsRainbowBeam. Used when `PORT` env var is unset.
 */
export const ENSRAINBOWBEAM_DEFAULT_PORT = 4444;

function parseCorsOrigins(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

const ConfigSchema = z.object({
  PORT: OptionalPortNumberSchema.default(ENSRAINBOWBEAM_DEFAULT_PORT),
  ENSNODE_URL: z.string().url(),
  CORS_ORIGINS: z.string().optional(),
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
  corsOrigins: parseCorsOrigins(parsed.CORS_ORIGINS),
};

export type Config = typeof config;
