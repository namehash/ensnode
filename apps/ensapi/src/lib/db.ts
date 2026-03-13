import config from "@/config";

import { EnsIndexerDbReader } from "@ensnode/ensnode-schema";

// TODO: pending rename `config.databaseUrl` to `config.ensDbUrl`
// Will be executed once https://github.com/namehash/ensnode/issues/1763 is resolved.
const ensDbUrl = config.databaseUrl;
// TODO: pending rename `config.databaseSchemaName` to `config.ensIndexerSchemaName`
// Will be executed once https://github.com/namehash/ensnode/issues/1762 is resolved.
const ensIndexerSchemaName = config.databaseSchemaName;

const ensIndexerDbReader = new EnsIndexerDbReader(ensDbUrl, ensIndexerSchemaName);

/**
 * Read-only Drizzle instance for queries to ENSIndexer Schema in ENSDb.
 */
export const ensIndexerDbReadonly = ensIndexerDbReader.db;

/**
 * Read-only Drizzle instance for queries to ENSIndexer Schema in ENSDb.
 */
export const db = ensIndexerDbReadonly;
