import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { and, eq } from "drizzle-orm/sql";

import * as ensNodeSchema from "@ensnode/ensnode-schema/ensnode";
import {
  type CrossChainIndexingStatusSnapshot,
  deserializeCrossChainIndexingStatusSnapshot,
  deserializeEnsIndexerPublicConfig,
  type EnsDbClientMigration,
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
 * Drizzle database
 *
 * Allows interacting with Postgres database for ENSDb, using Drizzle ORM.
 */
interface DrizzleDb extends NodePgDatabase<typeof ensNodeSchema> {}

/**
 * ENSDb Client
 *
 * This client exists to provide an abstraction layer for interacting with ENSDb.
 * It enables ENSIndexer and ENSApi to decouple from each other, and use
 * ENSDb as the integration point between the two (via ENSDb Client).
 *
 * Enables querying and mutating ENSDb data, such as:
 * - ENSDb version
 * - ENSIndexer Public Config, and Indexing Status Snapshot and CrossChainIndexingStatusSnapshot.
 */
export class EnsDbClient implements EnsDbClientQuery, EnsDbClientMutation, EnsDbClientMigration {
  /**
   * Drizzle database instance for ENSDb.
   */
  private db: DrizzleDb;

  /**
   * ENSIndexer reference string for multi-tenancy in ENSDb.
   */
  private ensIndexerRef: string;

  /**
   * @param databaseUrl connection string for ENSDb Postgres database
   * @param ensIndexerRef reference string for ENSIndexer instance (used for multi-tenancy in ENSDb)
   */
  constructor(databaseUrl: string, ensIndexerRef: string) {
    this.db = makeDrizzle({
      databaseUrl,
      schema: ensNodeSchema,
    });

    this.ensIndexerRef = ensIndexerRef;
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
   * @inheritdoc
   */
  async upsertEnsDbVersion(ensDbVersion: string): Promise<void> {
    await this.upsertEnsNodeMetadata({
      key: EnsNodeMetadataKeys.EnsDbVersion,
      value: ensDbVersion,
    });
  }

  /**
   * @inheritdoc
   */
  async upsertEnsIndexerPublicConfig(
    ensIndexerPublicConfig: EnsIndexerPublicConfig,
  ): Promise<void> {
    await this.upsertEnsNodeMetadata({
      key: EnsNodeMetadataKeys.EnsIndexerPublicConfig,
      value: serializeEnsIndexerPublicConfig(ensIndexerPublicConfig),
    });
  }

  /**
   * @inheritdoc
   */
  async upsertIndexingStatusSnapshot(
    indexingStatus: CrossChainIndexingStatusSnapshot,
  ): Promise<void> {
    await this.upsertEnsNodeMetadata({
      key: EnsNodeMetadataKeys.EnsIndexerIndexingStatus,
      value: serializeCrossChainIndexingStatusSnapshot(indexingStatus),
    });
  }

  /**
   * Get ENSNode metadata record
   *
   * @returns selected record in ENSDb.
   * @throws when more than one matching metadata record is found
   *         (should be impossible given the composite PK constraint on
   *         'ensIndexerRef' and 'key').
   */
  private async getEnsNodeMetadata<EnsNodeMetadataType extends SerializedEnsNodeMetadata>(
    metadata: Pick<EnsNodeMetadataType, "key">,
  ): Promise<EnsNodeMetadataType["value"] | undefined> {
    const result = await this.db
      .select()
      .from(ensNodeSchema.ensNodeMetadata)
      .where(
        and(
          eq(ensNodeSchema.ensNodeMetadata.ensIndexerRef, this.ensIndexerRef),
          eq(ensNodeSchema.ensNodeMetadata.key, metadata.key),
        ),
      );

    if (result.length === 0) {
      return undefined;
    }

    if (result.length === 1 && result[0]) {
      return result[0].value as EnsNodeMetadataType["value"];
    }

    throw new Error(`There must be exactly one ENSNodeMetadata record for '${metadata.key}' key`);
  }

  /**
   * Upsert ENSNode metadata
   *
   * @throws when upsert operation failed.
   */
  private async upsertEnsNodeMetadata<
    EnsNodeMetadataType extends SerializedEnsNodeMetadata = SerializedEnsNodeMetadata,
  >(metadata: EnsNodeMetadataType): Promise<void> {
    await this.db
      .insert(ensNodeSchema.ensNodeMetadata)
      .values({
        ensIndexerRef: this.ensIndexerRef,
        key: metadata.key,
        value: metadata.value,
      })
      .onConflictDoUpdate({
        target: [ensNodeSchema.ensNodeMetadata.ensIndexerRef, ensNodeSchema.ensNodeMetadata.key],
        set: { value: metadata.value },
      });
  }

  /**
   * @inheritdoc
   */
  async migrate(migrationsDirPath: string): Promise<void> {
    return migrate(this.db, {
      migrationsFolder: migrationsDirPath,
      migrationsSchema: ensNodeSchema.ENSNODE_SCHEMA_NAME,
    });
  }
}
