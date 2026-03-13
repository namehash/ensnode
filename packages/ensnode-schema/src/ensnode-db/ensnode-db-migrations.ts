/**
 * Client interface for executing  pending database migrations on
 * ENSNode Schema in ENSDb.
 */
export interface EnsNodeDbMigrations {
  /**
   * Execute pending database migrations for ENSNode Schema in ENSDb.
   *
   * @param migrationsDirPath - The file path to the directory containing
   *                            database migration files for ENSNode Schema.
   * @throws error when migration execution fails.
   */
  migrate(migrationsDirPath: string): Promise<void>;
}
