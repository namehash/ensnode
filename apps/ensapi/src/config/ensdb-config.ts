import { buildEnsDbConfigFromEnvironment } from "./ensdb-config.schema";

export default buildEnsDbConfigFromEnvironment(process.env);
