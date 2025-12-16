import * as schema from "@ensnode/ensnode-schema";
import type {
  SerializedCrossChainIndexingStatusSnapshot,
  SerializedENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import type { EnsDbClient } from "./ensdb-connection";
import { type EnsNodeMetadata, EnsNodeMetadataKeys } from "./ensnode-metadata";

/**
 * ENSDb Mutation
 *
 * The database client performing write operations.
 */
export class EnsDbMutation {
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
    indexingStatus: SerializedCrossChainIndexingStatusSnapshot,
  ): Promise<SerializedCrossChainIndexingStatusSnapshot> {
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
