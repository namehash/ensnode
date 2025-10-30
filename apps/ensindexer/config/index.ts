import { buildConfigFromEnvironment } from "@/config/config.schema";

// build, validate, and export the ENSIndexerConfig from process.env
export default buildConfigFromEnvironment(process.env);
