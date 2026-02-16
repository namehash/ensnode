import { buildEnvConfigFromEnvironment } from "./config.schema";

export type { ArgsConfig, ENSRainbowEnvConfig } from "./config.schema";
export {
  buildEnvConfigFromEnvironment,
  buildServeArgsConfig,
} from "./config.schema";
export { ENSRAINBOW_DEFAULT_PORT } from "./defaults";
export type { ENSRainbowEnvironment } from "./environment";
export { buildENSRainbowPublicConfig } from "./public";

export default buildEnvConfigFromEnvironment(process.env);
