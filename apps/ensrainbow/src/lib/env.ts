import { buildConfigFromEnvironment } from "@/config/config.schema";
import { ENSRAINBOW_DEFAULT_PORT } from "@/config/defaults";
import type { ENSRainbowEnvironment } from "@/config/environment";

/**
 * @deprecated Use buildConfigFromEnvironment() instead. This constant is kept for backward compatibility.
 */
export const DEFAULT_PORT = ENSRAINBOW_DEFAULT_PORT;

/**
 * Gets the port from environment variables.
 *
 * @deprecated Use buildConfigFromEnvironment() instead. This function is kept for backward compatibility.
 */
export function getEnvPort(): number {
  const config = buildConfigFromEnvironment(process.env as ENSRainbowEnvironment);
  return config.port;
}
