import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm/sql";

import { ensNodeMetadata } from "@ensnode/ensnode-schema";
import {
  type CrossChainIndexingStatusSnapshot,
  deserializeCrossChainIndexingStatusSnapshot,
  deserializeEnsIndexerPublicConfig,
  type EnsDbClientMutation,
  type EnsDbClientQuery,
  type EnsIndexerPublicConfig,
  EnsNodeMetadataKeys,
  type SerializedEnsNodeMetadata,
  type SerializedEnsNodeMetadataEnsDbVersion,
  type SerializedEnsNodeMetadataEnsIndexerIndexingStatus,
  type SerializedEnsNodeMetadataEnsIndexerPublicConfig,
  serializeCrossChainIndexingStatusSnapshot,
  serializeEnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import { makeDrizzle } from "./drizzle";

/**
 * ENSDb Client Schema
 *
 * Includes schema definitions for {@link EnsDbClient} queries and mutations.
 */
const schema = {
  ensNodeMetadata,
};

/**
 * Drizzle database
 *
 * Allows interacting with Postgres database for ENSDb, using Drizzle ORM.
 */
interface DrizzleDb extends NodePgDatabase<typeof schema> {}

/**
 * ENSDb Client
 *
 * This client exists to provide an abstraction layer for interacting with ENSDb.
 * It enables ENSIndexer and ENSApi to decouple from each other, and use
 * ENSDb as the integration point between the two (via ENSDb Client).
 *
 * Enables querying ENSDb data, such as:
 * - ENSDb version
 * - ENSIndexer Public Config, and Indexing Status Snapshot and CrossChainIndexingStatusSnapshot.
 */
export class EnsDbClient implements EnsDbClientQuery {
  /**
   * Drizzle database instance for ENSDb.
   */
  private _db: DrizzleDb;

  /**
   * @param databaseUrl connection string for ENSDb Postgres database
   * @param databaseSchemaName Postgres schema name for ENSDb tables
   */
  constructor(databaseUrl: string, databaseSchemaName: string) {
    this._db = makeDrizzle({
      databaseSchema: databaseSchemaName,
      databaseUrl,
      schema,
    });
  }

  /**
   * Exposes the Drizzle database instance for direct queries to ENSDb.
   */
  get db() {
    return this._db;
  }

  /**
   * @inheritdoc
   */
  async getEnsDbVersion(): Promise<string | undefined> {
    const record = await this.getEnsNodeMetadata<SerializedEnsNodeMetadataEnsDbVersion>({
      key: EnsNodeMetadataKeys.EnsDbVersion,
    });

    return record;
  }

  /**
   * @inheritdoc
   */
  async getEnsIndexerPublicConfig(): Promise<EnsIndexerPublicConfig | undefined> {
    const record = await this.getEnsNodeMetadata<SerializedEnsNodeMetadataEnsIndexerPublicConfig>({
      key: EnsNodeMetadataKeys.EnsIndexerPublicConfig,
    });

    if (!record) {
      return undefined;
    }

    return deserializeEnsIndexerPublicConfig(record);
  }

  /**
   * @inheritdoc
   */
  async getIndexingStatusSnapshot(): Promise<CrossChainIndexingStatusSnapshot | undefined> {
    const record = await this.getEnsNodeMetadata<SerializedEnsNodeMetadataEnsIndexerIndexingStatus>(
      {
        key: EnsNodeMetadataKeys.EnsIndexerIndexingStatus,
      },
    );

    if (!record) {
      return undefined;
    }

    return deserializeCrossChainIndexingStatusSnapshot(record);
  }

  /**
   * Get ENSNode metadata record
   *
   * @returns selected record in ENSDb.
   * @throws when more than one matching metadata record is found
   *         (should be impossible given the PK constraint on 'key')
   */
  private async getEnsNodeMetadata<EnsNodeMetadataType extends SerializedEnsNodeMetadata>(
    metadata: Pick<EnsNodeMetadataType, "key">,
  ): Promise<EnsNodeMetadataType["value"] | undefined> {
    const result = await this.db
      .select()
      .from(ensNodeMetadata)
      .where(eq(ensNodeMetadata.key, metadata.key));

    if (result.length === 0) {
      return undefined;
    }

    if (result.length === 1 && result[0]) {
      return result[0].value as EnsNodeMetadataType["value"];
    }

    throw new Error(`There must be exactly one ENSNodeMetadata record for '${metadata.key}' key`);
  }
}
