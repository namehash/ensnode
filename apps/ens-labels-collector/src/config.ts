import { z } from "zod";

const ConfigSchema = z.object({
  PORT: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? 4444 : Number.parseInt(value, 10)))
    .pipe(z.number().int().min(1).max(65535)),
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
