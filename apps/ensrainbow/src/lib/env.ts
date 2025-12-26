import { buildConfigFromEnvironment } from "@/config/config.schema";
import type { ENSRainbowEnvironment } from "@/config/environment";

/**
 * Gets the port from environment variables.
 */
export function getEnvPort(): number {
  const config = buildConfigFromEnvironment(process.env as ENSRainbowEnvironment);
  return config.port;
}
