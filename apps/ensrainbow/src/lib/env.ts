import config from "@/config";

/**
 * Gets the port from environment variables.
 */
export function getEnvPort(): number {
  return config.port;
}
