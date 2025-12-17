import config from "@/config";

import { eq } from "drizzle-orm/sql";

import * as schema from "@ensnode/ensnode-schema";
import type {
  SerializedCrossChainIndexingStatusSnapshot,
  SerializedENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import { makeDrizzle } from "./drizzle";
import {
  type EnsNodeMetadata,
  type EnsNodeMetadataEnsIndexerPublicConfig,
  type EnsNodeMetadataIndexingStatus,
  EnsNodeMetadataKeys,
} from "./ensnode-metadata";

/**
 * ENSDb Client Query
 * 
  Includes methods for reading from ENSDb.
 */
export interface EnsDbClientQuery {
  getEnsIndexerPublicConfig(): Promise<SerializedENSIndexerPublicConfig | undefined>;

  getIndexingStatus(): Promise<SerializedCrossChainIndexingStatusSnapshot | undefined>;
}

/**
 * ENSDb Client Mutation
 *
 * Includes methods for writing into ENSDb.
 */
export interface EnsDbClientMutation {
  upsertEnsIndexerPublicConfig(
    ensIndexerPublicConfig: SerializedENSIndexerPublicConfig,
  ): Promise<SerializedENSIndexerPublicConfig>;

  upsertIndexingStatus(
    indexingStatus: SerializedCrossChainIndexingStatusSnapshot,
  ): Promise<SerializedCrossChainIndexingStatusSnapshot>;
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
  async getEnsIndexerPublicConfig(): Promise<SerializedENSIndexerPublicConfig | undefined> {
    return this.getEnsNodeMetadata<EnsNodeMetadataEnsIndexerPublicConfig>({
      key: EnsNodeMetadataKeys.EnsIndexerPublicConfig,
    });
  }

  /**
   * Upsert Indexing Status
   *
   * @returns updated record in ENSDb.
   * @throws when upsert operation failed.
   */
  async getIndexingStatus(): Promise<SerializedCrossChainIndexingStatusSnapshot | undefined> {
    return this.getEnsNodeMetadata<EnsNodeMetadataIndexingStatus>({
      key: EnsNodeMetadataKeys.IndexingStatus,
    });
  }

  /**
   * Upsert ENSIndexer Public Config
   *
   * @returns updated record in ENSDb.
   * @throws when upsert operation failed.
   */
  async upsertEnsIndexerPublicConfig(
    ensIndexerPublicConfig: SerializedENSIndexerPublicConfig,
  ): Promise<SerializedENSIndexerPublicConfig> {
    return this.upsertEnsNodeMetadata({
      key: EnsNodeMetadataKeys.EnsIndexerPublicConfig,
      value: ensIndexerPublicConfig,
    });
  }

  /**
   * Upsert Indexing Status
   *
   * @returns updated record in ENSDb.
   * @throws when upsert operation failed.
   */
  async upsertIndexingStatus(
    indexingStatus: SerializedCrossChainIndexingStatusSnapshot,
  ): Promise<SerializedCrossChainIndexingStatusSnapshot> {
    return this.upsertEnsNodeMetadata({
      key: EnsNodeMetadataKeys.IndexingStatus,
      value: indexingStatus,
    });
  }

  /**
   * Get ENSNode metadata record
   *
   * @returns selected record in ENSDb.
   * @throws when exactly one matching metadata record was not found
   */
  private async getEnsNodeMetadata<EnsNodeMetadataType extends EnsNodeMetadata = EnsNodeMetadata>(
    metadata: Pick<EnsNodeMetadataType, "key">,
  ): Promise<EnsNodeMetadataType["value"] | undefined> {
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
   * @returns updated record in ENSDb.
   * @throws when upsert operation failed.
   */
  private async upsertEnsNodeMetadata<
    EnsNodeMetadataType extends EnsNodeMetadata = EnsNodeMetadata,
  >(metadata: EnsNodeMetadataType): Promise<EnsNodeMetadataType["value"]> {
    const [result] = await this.#db
      .insert(schema.ensNodeMetadata)
      .values({
        key: metadata.key,
        value: metadata.value,
      })
      .onConflictDoUpdate({
        target: schema.ensNodeMetadata.key,
        set: { value: metadata.value },
      })
      .returning({ value: schema.ensNodeMetadata.value });

    if (!result) {
      throw new Error(`Failed to upsert metadata for key: ${metadata.key}`);
    }

    return result.value as EnsNodeMetadataType["value"];
  }
}
