import config from "@/config";

import { EnsDbClient } from "./ensdb-client";

/**
 * Singleton instance of {@link EnsDbClient} for use in ENSApi.
 */
export const ensDbClient = new EnsDbClient(config.databaseUrl, config.databaseSchemaName);
