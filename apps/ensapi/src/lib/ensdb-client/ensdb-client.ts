import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, eq } from "drizzle-orm/sql";

import * as ensNodeSchema from "@ensnode/ensnode-schema/ensnode";
import {
  type CrossChainIndexingStatusSnapshot,
  deserializeCrossChainIndexingStatusSnapshot,
  deserializeEnsIndexerPublicConfig,
  type EnsDbClientQuery,
  type EnsIndexerPublicConfig,
  EnsNodeMetadataKeys,
  type SerializedEnsNodeMetadata,
  type SerializedEnsNodeMetadataEnsDbVersion,
  type SerializedEnsNodeMetadataEnsIndexerIndexingStatus,
  type SerializedEnsNodeMetadataEnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import { makeReadOnlyDrizzle } from "@/lib/handlers/drizzle";

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
 * Enables querying ENSDb data, such as:
 * - ENSDb version
 * - ENSIndexer Public Config,
 * - Indexing Status Snapshot.
 */
export class EnsDbClient implements EnsDbClientQuery {
  /**
   * Drizzle database instance for ENSDb.
   *
   * This is a read-only Drizzle instance, since ENSApi should not be
   * performing any mutations on the database.
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
    this.db = makeReadOnlyDrizzle({
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
}
