import * as schema from "@ensnode/ensnode-schema";
import type {
  CrossChainIndexingStatusSnapshot,
  SerializedENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import type { EnsDbClient } from "./ensdb-connection";

/**
 * Keys used to distinguish records in `ensnode_metadata` table in the ENSDb.
 */
export const EnsNodeMetadataKeys = {
  EnsIndexerPublicConfig: "ensindexer-public-config",
  IndexingStatus: "indexing-status",
} as const;

export type EnsNodeMetadataKey = (typeof EnsNodeMetadataKeys)[keyof typeof EnsNodeMetadataKeys];

export interface EnsNodeMetadataEnsIndexerPublicConfig {
  key: typeof EnsNodeMetadataKeys.EnsIndexerPublicConfig;
  value: SerializedENSIndexerPublicConfig;
}

export interface EnsNodeMetadataIndexingStatus {
  key: typeof EnsNodeMetadataKeys.IndexingStatus;
  value: CrossChainIndexingStatusSnapshot;
}

/**
 * ENSNode Metadata
 *
 * Union type gathering all variants of ENSNode Metadata.
 */
export type EnsNodeMetadata = EnsNodeMetadataEnsIndexerPublicConfig | EnsNodeMetadataIndexingStatus;

/**
 * ENSDb Writer Client
 *
 * The database client performing write operations.
 */
export class EnsDbWriterClient {
  constructor(private ensDbClient: EnsDbClient) {}

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
    indexingStatus: CrossChainIndexingStatusSnapshot,
  ): Promise<CrossChainIndexingStatusSnapshot> {
    return this.upsertEnsNodeMetadata({
      key: EnsNodeMetadataKeys.IndexingStatus,
      value: indexingStatus,
    });
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
    const [result] = await this.ensDbClient
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
