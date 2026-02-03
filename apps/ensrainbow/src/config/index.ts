import { buildConfigFromEnvironment } from "./config.schema";

export type { ENSRainbowEnvConfig } from "./config.schema";
export { buildConfigFromEnvironment, buildENSRainbowPublicConfig } from "./config.schema";
export { ENSRAINBOW_DEFAULT_PORT } from "./defaults";
export type { ENSRainbowEnvironment } from "./environment";

export default buildConfigFromEnvironment(process.env);
