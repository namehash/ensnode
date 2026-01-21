import { buildConfigFromEnvironment } from "./config.schema";
import type { ENSRainbowEnvironment } from "./environment";

export type { ENSRainbowConfig } from "./config.schema";
export { buildConfigFromEnvironment } from "./config.schema";
export { ENSRAINBOW_DEFAULT_PORT, getDefaultDataDir } from "./defaults";
export type { ENSRainbowEnvironment } from "./environment";

// build, validate, and export the ENSRainbowConfig from process.env
export default buildConfigFromEnvironment(process.env as ENSRainbowEnvironment);
