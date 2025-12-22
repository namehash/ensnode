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
  type SerializedEnsNodeMetadataEnsDbVersion,
  type SerializedEnsNodeMetadataEnsIndexerPublicConfig,
  type SerializedEnsNodeMetadataIndexingStatus,
} from "./ensnode-metadata";

/**
 * ENSDb Client Query
 * 
  Includes methods for reading from ENSDb.
 */
export interface EnsDbClientQuery {
  /**
   * Get ENSDb Version
   *
   * @returns the existing record, or `undefined`.
   * @throws if not exactly one record was found.
   */
  getEnsDbVersion(): Promise<string | undefined>;

  /**
   * Get ENSIndexer Public Config
   *
   * @returns the existing record, or `undefined`.
   * @throws if not exactly one record was found.
   */
  getEnsIndexerPublicConfig(): Promise<ENSIndexerPublicConfig | undefined>;

  /**
   * Get Indexing Status
   *
   * @returns the existing record, or `undefined`.
   * @throws if not exactly one record was found.
   */
  getIndexingStatus(): Promise<CrossChainIndexingStatusSnapshot | undefined>;
}

/**
 * ENSDb Client Mutation
 *
 * Includes methods for writing into ENSDb.
 */
export interface EnsDbClientMutation {
  /**
   * Upsert ENSDb Version
   *
   * @throws when upsert operation failed.
   */
  upsertEnsDbVersion(ensDbVersion: string): Promise<void>;

  /**
   * Upsert ENSIndexer Public Config
   *
   * @throws when upsert operation failed.
   */
  upsertEnsIndexerPublicConfig(ensIndexerPublicConfig: ENSIndexerPublicConfig): Promise<void>;

  /**
   * Upsert Indexing Status
   *
   * @throws when upsert operation failed.
   */
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

  async getEnsDbVersion(): Promise<string | undefined> {
    const record = await this.getEnsNodeMetadata<SerializedEnsNodeMetadataEnsDbVersion>({
      key: EnsNodeMetadataKeys.EnsDbVersion,
    });

    return record;
  }

  async getEnsIndexerPublicConfig(): Promise<ENSIndexerPublicConfig | undefined> {
    const record = await this.getEnsNodeMetadata<SerializedEnsNodeMetadataEnsIndexerPublicConfig>({
      key: EnsNodeMetadataKeys.EnsIndexerPublicConfig,
    });

    if (!record) {
      return undefined;
    }

    return deserializeENSIndexerPublicConfig(record);
  }

  async getIndexingStatus(): Promise<CrossChainIndexingStatusSnapshot | undefined> {
    const record = await this.getEnsNodeMetadata<SerializedEnsNodeMetadataIndexingStatus>({
      key: EnsNodeMetadataKeys.IndexingStatus,
    });

    if (!record) {
      return undefined;
    }

    return deserializeCrossChainIndexingStatusSnapshot(record);
  }

  async upsertEnsDbVersion(ensDbVersion: string): Promise<void> {
    await this.upsertEnsNodeMetadata({
      key: EnsNodeMetadataKeys.EnsDbVersion,
      value: ensDbVersion,
    });
  }

  async upsertEnsIndexerPublicConfig(
    ensIndexerPublicConfig: ENSIndexerPublicConfig,
  ): Promise<void> {
    await this.upsertEnsNodeMetadata({
      key: EnsNodeMetadataKeys.EnsIndexerPublicConfig,
      value: serializeENSIndexerPublicConfig(ensIndexerPublicConfig),
    });
  }

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
