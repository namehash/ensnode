import { and, eq } from "drizzle-orm";

import {
  type CrossChainIndexingStatusSnapshot,
  deserializeCrossChainIndexingStatusSnapshot,
  deserializeEnsIndexerPublicConfig,
  type EnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import * as ensNodeSchema from "../ensnode-schema";
import { buildDrizzleDbReadonly, type EnsDbDrizzleReadonly } from "../lib/drizzle";
import type { EnsNodeDbQueries } from "./ensnode-db-queries";
import { EnsNodeMetadataKeys } from "./ensnode-metadata";
import type {
  SerializedEnsNodeMetadata,
  SerializedEnsNodeMetadataEnsDbVersion,
  SerializedEnsNodeMetadataEnsIndexerIndexingStatus,
  SerializedEnsNodeMetadataEnsIndexerPublicConfig,
} from "./serialize/ensnode-metadata";

/**
 * ENSNode Database Reader
 *
 * Provides readonly access to ENSNode Schema in ENSDb.
 */
export class EnsNodeDbReader implements EnsNodeDbQueries {
  /**
   * Readonly Drizzle database instance for ENSNode Schema in ENSDb.
   */
  private ensNodeDbReadonly: EnsDbDrizzleReadonly<typeof ensNodeSchema>;

  /**
   * ENSIndexer Schema Name
   *
   * Used for composite primary key in 'ensNodeMetadata' table to support
   * multi-tenancy where records with the same `key` can coexist for different
   * ENSIndexer instances without conflict.
   */
  protected ensIndexerSchemaName: string;

  /**
   * @param ensDbConnectionString connection string for ENSDb Postgres database
   * @param ensIndexerSchemaName reference string for ENSIndexer instance (used for multi-tenancy in ENSDb)
   */
  constructor(ensDbConnectionString: string, ensIndexerSchemaName: string) {
    this.ensNodeDbReadonly = buildDrizzleDbReadonly(ensDbConnectionString, ensNodeSchema);
    this.ensIndexerSchemaName = ensIndexerSchemaName;
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
    const result = await this.ensNodeDbReadonly
      .select()
      .from(ensNodeSchema.ensNodeMetadata)
      .where(
        and(
          eq(ensNodeSchema.ensNodeMetadata.ensIndexerSchemaName, this.ensIndexerSchemaName),
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
