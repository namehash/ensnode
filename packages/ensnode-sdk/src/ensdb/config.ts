/**
 * Version info about ENSDb and its dependencies.
 */
export interface EnsDbVersionInfo {
  /**
   * Version of the PostgreSQL server hosting the ENSDb instance.
   */
  postgresql: string;
}

/**
 * The public configuration of an ENSDb instance.
 */
export interface EnsDbPublicConfig {
  /**
   * Version info about ENSDb.
   */
  versionInfo: EnsDbVersionInfo;
}
