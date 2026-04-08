/**
 * ENSDb Config
 */
export interface EnsDbConfig {
  /**
   * PostgreSQL connection string for ENSDb.
   *
   * Guaranteed to be a valid PostgreSQL connection string with the format:
   * `postgresql://username:password@host:port/database` or
   * `postgres://username:password@host:port/database`
   */
  ensDbUrl: string;

  /**
   * The name of the ENSIndexer Schema in the ENSDb instance.
   *
   * Guaranteed to be a non-empty string that is
   * a valid Postgres database schema identifier
   */
  ensIndexerSchemaName: string;
}
