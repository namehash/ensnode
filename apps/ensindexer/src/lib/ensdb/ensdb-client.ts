import config from "@/config";

import { eq } from "drizzle-orm/sql";

import * as schema from "@ensnode/ensnode-schema";
import {
  type CrossChainIndexingStatusSnapshot,
  deserializeCrossChainIndexingStatusSnapshot,
  deserializeENSIndexerPublicConfig,
  type ENSIndexerPublicConfig,
  serializeCrossChainIndexingStatusSnapshotOmnichain,
  serializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import { makeDrizzle } from "./drizzle";
import {
  EnsNodeMetadataKeys,
  type SerializedEnsNodeMetadata,
  type SerializedEnsNodeMetadataEnsIndexerPublicConfig,
  type SerializedEnsNodeMetadataIndexingStatus,
} from "./ensnode-metadata";

/**
 * ENSDb Client Query
 * 
  Includes methods for reading from ENSDb.
 */
export interface EnsDbClientQuery {
  getEnsIndexerPublicConfig(): Promise<ENSIndexerPublicConfig | undefined>;

  getIndexingStatus(): Promise<CrossChainIndexingStatusSnapshot | undefined>;
}

/**
 * ENSDb Client Mutation
 *
 * Includes methods for writing into ENSDb.
 */
export interface EnsDbClientMutation {
  upsertEnsIndexerPublicConfig(ensIndexerPublicConfig: ENSIndexerPublicConfig): Promise<void>;

  upsertIndexingStatus(indexingStatus: CrossChainIndexingStatusSnapshot): Promise<void>;
}

/**
 * ENSDb Client
 */
export class EnsDbClient implements EnsDbClientQuery, EnsDbClientMutation {
  #db = makeDrizzle({
    databaseSchema: config.databaseSchemaName,
    databaseUrl: config.databaseUrl,
    schema,
  });

  /**
   * Upsert ENSIndexer Public Config
   *
   * @returns updated record in ENSDb.
   * @throws when upsert operation failed.
   */
  async getEnsIndexerPublicConfig(): Promise<ENSIndexerPublicConfig | undefined> {
    const record = await this.getEnsNodeMetadata<SerializedEnsNodeMetadataEnsIndexerPublicConfig>({
      key: EnsNodeMetadataKeys.EnsIndexerPublicConfig,
    });

    if (!record) {
      return undefined;
    }

    return deserializeENSIndexerPublicConfig(record);
  }

  /**
   * Upsert Indexing Status
   *
   * @returns updated record in ENSDb.
   * @throws when upsert operation failed.
   */
  async getIndexingStatus(): Promise<CrossChainIndexingStatusSnapshot | undefined> {
    const record = await this.getEnsNodeMetadata<SerializedEnsNodeMetadataIndexingStatus>({
      key: EnsNodeMetadataKeys.IndexingStatus,
    });

    if (!record) {
      return undefined;
    }

    return deserializeCrossChainIndexingStatusSnapshot(record);
  }

  /**
   * Upsert ENSIndexer Public Config
   *
   * @throws when upsert operation failed.
   */
  async upsertEnsIndexerPublicConfig(
    ensIndexerPublicConfig: ENSIndexerPublicConfig,
  ): Promise<void> {
    await this.upsertEnsNodeMetadata({
      key: EnsNodeMetadataKeys.EnsIndexerPublicConfig,
      value: serializeENSIndexerPublicConfig(ensIndexerPublicConfig),
    });
  }

  /**
   * Upsert Indexing Status
   *
   * @throws when upsert operation failed.
   */
  async upsertIndexingStatus(indexingStatus: CrossChainIndexingStatusSnapshot): Promise<void> {
    await this.upsertEnsNodeMetadata({
      key: EnsNodeMetadataKeys.IndexingStatus,
      value: serializeCrossChainIndexingStatusSnapshotOmnichain(indexingStatus),
    });
  }

  /**
   * Get ENSNode metadata record
   *
   * @returns selected record in ENSDb.
   * @throws when exactly one matching metadata record was not found
   */
  private async getEnsNodeMetadata<
    EnsNodeMetadataType extends SerializedEnsNodeMetadata = SerializedEnsNodeMetadata,
  >(metadata: Pick<EnsNodeMetadataType, "key">): Promise<EnsNodeMetadataType["value"] | undefined> {
    const result = await this.#db
      .select()
      .from(schema.ensNodeMetadata)
      .where(eq(schema.ensNodeMetadata.key, metadata.key));

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
    await this.#db
      .insert(schema.ensNodeMetadata)
      .values({
        key: metadata.key,
        value: metadata.value,
      })
      .onConflictDoUpdate({
        target: schema.ensNodeMetadata.key,
        set: { value: metadata.value },
      });
  }
}
