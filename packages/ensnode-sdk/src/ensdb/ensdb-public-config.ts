export interface EnsDbPublicConfig {
  /**
   * Version of Postgres in the ENSDb instance.
   */
  postgresVersion: string;

  /**
   * Root schema version for ENSNode tables in the ENSDb instance.
   */
  rootSchemaVersion: string;
}
