import { and, eq } from "drizzle-orm/sql";

import {
  type CrossChainIndexingStatusSnapshot,
  deserializeCrossChainIndexingStatusSnapshot,
  deserializeEnsIndexerPublicConfig,
  type EnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import {
  type AbstractEnsIndexerSchema,
  buildEnsDbDrizzleClient,
  buildIndividualEnsDbSchemas,
  type EnsDbDrizzleClient,
  type EnsNodeSchema,
} from "../lib/drizzle";
import { EnsNodeMetadataKeys } from "./ensnode-metadata";
import type {
  SerializedEnsNodeMetadata,
  SerializedEnsNodeMetadataEnsDbVersion,
  SerializedEnsNodeMetadataEnsIndexerIndexingStatus,
  SerializedEnsNodeMetadataEnsIndexerPublicConfig,
} from "./serialize/ensnode-metadata";

/**
 * Re-export the ENSDb Drizzle Client type for external use in building
 * custom ENSDb queries with proper typing of the "concrete" ENSIndexer Schema
 * from the ENSDbReader instance.
 */
export type { EnsDbDrizzleClient } from "../lib/drizzle";

/**
 * ENSDb Reader
 *
 * Enables read-only querying of an ENSDb instance, including data spanning
 * the ENSNode Schema and the specified ENSIndexer Schema.
 *
 * Note: we use a parameter type `ConcreteEnsIndexerSchema` to represent
 * the "concrete" ENSIndexer Schema type within the ENSDb Schema and
 * make sure that the Drizzle client used for querying is typed with
 * the same "concrete" ENSIndexer Schema type.
 */
export class EnsDbReader<
  ConcreteEnsIndexerSchema extends AbstractEnsIndexerSchema = AbstractEnsIndexerSchema,
> {
  /**
   * Drizzle client for ENSDb.
   *
   * Uses the ENSDb Schema from {@link ensDbSchema}.
   */
  protected drizzleClient: EnsDbDrizzleClient<ConcreteEnsIndexerSchema>;

  /**
   * "Concrete" ENSIndexer Schema definition for ENSDb.
   *
   * This is the "concrete" ENSIndexer Schema in which tables reference
   * the ENSIndexer Schema name from {@link ensIndexerSchemaName}.
   */
  protected _concreteEnsIndexerSchema: ConcreteEnsIndexerSchema;

  /**
   * The name of the ENSIndexer schema to read from in ENSDb.
   *
   * This also identifies which ENSNode metadata records to read from the ENSNode Schema
   * as the ENSNode Schema is multi-tenant across ENSIndexer instances / ENSIndexer Schemas in an ENSDb.
   */
  protected _ensIndexerSchemaName: string;

  protected _ensNodeSchema: EnsNodeSchema;

  /**
   * @param ensDbUrl The connection string for Drizzle to connect to the ENSDb instance.
   * @param ensIndexerSchemaName The name of the ENSIndexer schema to read from in ENSDb, used to identify which ENSNode metadata records to read.
   */
  constructor(ensDbUrl: string, ensIndexerSchemaName: string) {
    const { concreteEnsIndexerSchema, ensNodeSchema } =
      buildIndividualEnsDbSchemas<ConcreteEnsIndexerSchema>(ensIndexerSchemaName);
    const ensDbDrizzleClient = buildEnsDbDrizzleClient<ConcreteEnsIndexerSchema>(
      ensDbUrl,
      concreteEnsIndexerSchema,
    );
    this.drizzleClient = ensDbDrizzleClient;
    this._concreteEnsIndexerSchema = concreteEnsIndexerSchema;
    this._ensIndexerSchemaName = ensIndexerSchemaName;
    this._ensNodeSchema = ensNodeSchema;
  }

  /**
   * Getter for the Drizzle client for ENSDb instance
   *
   * Useful while working on complex queries for ENSDb.
   */
  get ensDb(): EnsDbDrizzleClient<ConcreteEnsIndexerSchema> {
    return this.drizzleClient;
  }

  /**
   * Getter for the "concrete" ENSIndexer Schema definition used in the Drizzle client
   * for ENSDb instance.
   *
   * Useful while working on complex queries for ENSDb.
   *
   * Note: using `ensIndexerSchema` name for this getter to make it read better
   * in the context of query building. For example:
   * `this.ensDb.select().from(this.ensIndexerSchema.event)` vs.
   * `this.ensDb.select().from(this.concreteEnsIndexerSchema.event)`.
   */
  get ensIndexerSchema(): ConcreteEnsIndexerSchema {
    return this._concreteEnsIndexerSchema;
  }

  /**
   * Getter for the ENSIndexer Schema Name used by this ENSDbReader instance.
   */
  get ensIndexerSchemaName(): string {
    return this._ensIndexerSchemaName;
  }

  /**
   * Getter for the ENSNode Schema definition used in the Drizzle client
   * for ENSDb instance.
   *
   * Useful while working on complex queries for ENSDb.
   */
  get ensNodeSchema(): EnsNodeSchema {
    return this._ensNodeSchema;
  }

  /**
   * Get ENSDb Version
   *
   * @returns the existing record, or `undefined`.
   */
  async getEnsDbVersion(): Promise<string | undefined> {
    const record = await this.getEnsNodeMetadata<SerializedEnsNodeMetadataEnsDbVersion>({
      key: EnsNodeMetadataKeys.EnsDbVersion,
    });

    return record;
  }

  /**
   * Get ENSIndexer Public Config
   *
   * @returns the existing record, or `undefined`.
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
   * Get Indexing Status Snapshot
   *
   * @returns the existing record, or `undefined`.
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
   * Get ENSNode Metadata record
   *
   * @returns selected record in ENSDb.
   * @throws when more than one matching metadata record is found
   *         (should be impossible given the composite PK constraint on
   *         'ensIndexerSchemaName' and 'key')
   */
  private async getEnsNodeMetadata<EnsNodeMetadataType extends SerializedEnsNodeMetadata>(
    metadata: Pick<EnsNodeMetadataType, "key">,
  ): Promise<EnsNodeMetadataType["value"] | undefined> {
    const result = await this.ensDb
      .select()
      .from(this.ensNodeSchema.metadata)
      .where(
        and(
          eq(this.ensNodeSchema.metadata.ensIndexerSchemaName, this.ensIndexerSchemaName),
          eq(this.ensNodeSchema.metadata.key, metadata.key),
        ),
      );

    if (result.length === 0) {
      return undefined;
    }

    if (result.length === 1 && result[0]) {
      return result[0].value as EnsNodeMetadataType["value"];
    }

    throw new Error(
      `There must be exactly one ENSNodeMetadata record for ('${this.ensIndexerSchemaName}', '${metadata.key}') composite key`,
    );
  }
}
