import { z } from "zod";

import { OptionalPortNumberSchema } from "@ensnode/ensnode-sdk/internal";

/**
 * Default port for the ens-labels-collector HTTP server. Used when `PORT` env var is unset.
 */
export const ENS_LABELS_COLLECTOR_DEFAULT_PORT = 4444;

const ConfigSchema = z.object({
  PORT: OptionalPortNumberSchema.default(ENS_LABELS_COLLECTOR_DEFAULT_PORT),
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
