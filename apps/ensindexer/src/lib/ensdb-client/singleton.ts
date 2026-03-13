import config from "@/config";

import { EnsNodeDbWriter } from "@ensnode/ensnode-schema";

// TODO: pending rename `config.databaseSchemaName` to `config.ensIndexerSchemaName`
// Will be executed once https://github.com/namehash/ensnode/issues/1762 is resolved.
const ensIndexerSchemaName = config.databaseSchemaName;

/**
 * Singleton instance of {@link EnsNodeDbWriter} for use in ENSIndexer.
 */
export const ensNodeDbWriter = new EnsNodeDbWriter(config.databaseUrl, ensIndexerSchemaName);
