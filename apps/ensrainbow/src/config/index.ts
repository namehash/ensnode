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
  console.error("Configuration error:", error instanceof Error ? error.message : String(error));
  process.exit(1);
}

export default config;
