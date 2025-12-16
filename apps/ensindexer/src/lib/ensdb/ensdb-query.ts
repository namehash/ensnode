import { eq } from "drizzle-orm";

import * as schema from "@ensnode/ensnode-schema";
import type {
  SerializedCrossChainIndexingStatusSnapshot,
  SerializedENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import type { EnsDbClient } from "./ensdb-connection";
import {
  type EnsNodeMetadata,
  type EnsNodeMetadataEnsIndexerPublicConfig,
  type EnsNodeMetadataIndexingStatus,
  EnsNodeMetadataKeys,
} from "./ensnode-metadata";

/**
 * ENSDb Query
 *
 * The database client performing read operations.
 */
export class EnsDbQuery {
  constructor(private ensDbClient: EnsDbClient) {}

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
   * Get ENSNode metadata record
   *
   * @returns selected record in ENSDb.
   * @throws when exactly one matching metadata record was not found
   */
  private async getEnsNodeMetadata<EnsNodeMetadataType extends EnsNodeMetadata = EnsNodeMetadata>(
    metadata: Pick<EnsNodeMetadataType, "key">,
  ): Promise<EnsNodeMetadataType["value"] | undefined> {
    const result = await this.ensDbClient
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
}
