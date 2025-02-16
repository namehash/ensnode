import { join } from "path/posix";
import { logger } from "../utils/logger";
import { parseNonNegativeInteger } from "../utils/number-utils";

export const getDataDir = () => join(process.cwd(), "data");

export const DEFAULT_PORT = 3223;
export function getEnvPort(): number {
  const envPort = process.env.PORT;
  if (!envPort) {
    return DEFAULT_PORT;
  }

  try {
    const port = parseNonNegativeInteger(envPort);
    if (port === null) {
      throw new Error(`Invalid port number "${envPort}". Port must be a non-negative integer.`);
    }

    return port;
  } catch (error: unknown) {
    const errorMessage = `Environment variable error: (PORT): ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
