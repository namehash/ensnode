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

export type Config = {
  port: number;
  ensNodeUrl: string;
};

let cachedConfig: Config | undefined;

/**
 * Parses the process environment into a {@link Config}.
 *
 * Memoized so repeated calls return the same instance and validation only runs once.
 * Throws (via Zod) if any required env var is missing or invalid.
 */
export function getConfig(env: NodeJS.ProcessEnv = process.env): Config {
  if (cachedConfig) return cachedConfig;

  const parsed = ConfigSchema.parse(env);

  cachedConfig = {
    port: parsed.PORT,
    ensNodeUrl: parsed.ENSNODE_URL,
  };

  return cachedConfig;
}

/**
 * Resets the memoized config. Test-only.
 */
export function resetConfigCacheForTesting(): void {
  cachedConfig = undefined;
}
