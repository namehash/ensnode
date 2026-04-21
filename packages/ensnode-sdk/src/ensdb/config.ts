/**
 * Version info about ENSIndexer and its dependencies.
 */
export interface EnsDbVersionInfo {
  /**
   * Version of the PostgreSQL server hosting the ENSDb instance.
   */
  postgresql: string;
}

/**
 * Complete public configuration object for ENSDb.
 */
export interface EnsDbPublicConfig {
  /**
   * Version info about ENSDb.
   */
  versionInfo: EnsDbVersionInfo;
}
