/**
 * ENSDb Config
 */
export interface EnsDbConfig {
  /**
   * PostgreSQL connection string for ENSDb.
   * Expected format: postgresql://username:password@host:port/database
   */
  ensDbUrl: string;

  /**
   * The name of the ENSIndexer Schema in the ENSDb instance.
   */
  ensIndexerSchemaName: string;
}
