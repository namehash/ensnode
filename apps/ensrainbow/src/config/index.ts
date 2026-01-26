import { prettifyError, ZodError } from "zod/v4";

import { logger } from "@/utils/logger";

import { buildConfigFromEnvironment } from "./config.schema";
import type { ENSRainbowEnvironment } from "./environment";

export type { ENSRainbowConfig } from "./config.schema";
export { buildConfigFromEnvironment, buildENSRainbowPublicConfig } from "./config.schema";
export { ENSRAINBOW_DEFAULT_PORT, getDefaultDataDir } from "./defaults";
export type { ENSRainbowEnvironment } from "./environment";

// build, validate, and export the ENSRainbowConfig from process.env
let config: ReturnType<typeof buildConfigFromEnvironment>;
try {
  config = buildConfigFromEnvironment(process.env as ENSRainbowEnvironment);
} catch (error) {
  // For CLI applications, invalid configuration should exit the process
  if (error instanceof ZodError) {
    logger.error(
      `Failed to parse ENSRainbow environment configuration: \n${prettifyError(error)}\n`,
    );
  } else if (error instanceof Error) {
    logger.error(error, "Failed to build ENSRainbowConfig");
  } else {
    logger.error("Unknown error occurred during configuration");
  }
  process.exit(1);
}

export default config;
