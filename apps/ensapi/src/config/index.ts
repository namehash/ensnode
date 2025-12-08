import { buildConfigFromEnvironment } from "@/config/config.schema";

export default await buildConfigFromEnvironment(process.env);
