import { buildEnvConfigFromEnvironment } from "./config.schema";

export type { ENSRainbowEnvConfig, ServeCommandCliArgs, ServeCommandConfig } from "./config.schema";
export {
  buildEnvConfigFromEnvironment,
  buildServeCommandConfig,
} from "./config.schema";
export { ENSRAINBOW_DEFAULT_PORT } from "./defaults";
export type { ENSRainbowEnvironment } from "./environment";
export { buildENSRainbowPublicConfig } from "./public";

export default buildEnvConfigFromEnvironment(process.env);
