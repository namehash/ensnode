import { join } from "path";
import { parseNonNegativeInteger } from "@ensnode/ensrainbow-sdk";

import { logger } from "@/utils/logger";

export const getDefaultDataSubDir = () => join(process.cwd(), "data");

export const DEFAULT_PORT = 3223;
export function getEnvPort(): number {
  const envPort = process.env.PORT;
  if (!envPort) {
    return DEFAULT_PORT;
  }

  try {
    const port = parseNonNegativeInteger(envPort);
    return port;
  } catch (error: unknown) {
    const errorMessage = `Invalid PORT value "${envPort}": must be a non-negative integer`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
