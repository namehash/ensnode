import config from "@/config";

import { EnsDbClient } from "./ensdb-client";

// config.databaseSchemaName is unique per ENSIndexer instance and is used as the ensIndexerRef
// tenant key in the shared ENSNode schema (ensnode.*).
const ensIndexerRef = config.databaseSchemaName;

/**
 * Singleton instance of {@link EnsDbClient} for use in ENSIndexer.
 */
export const ensDbClient = new EnsDbClient(config.databaseUrl, ensIndexerRef);
