import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

import * as schema from "@ensnode/ensnode-schema";

import { makeDrizzle } from "@/lib/ensdb/drizzle";

export type EnsDbClient = NodePgDatabase<typeof schema>;

export interface EnsDbConnectionOptions {
  schemaName: string;
  poolConfig: PoolConfig;
}

/**
 * ENSDb Connection
 *
 * Enables:
 * - Connecting to ENSDb instance.
 * - Disconnecting from ENSDb instance.
 *
 * Uses application connection pool for improved performance.
 */
export class EnsDbConnection {
  #connectionPool: Pool | undefined;
  #ensDbClient: EnsDbClient | undefined;

  /**
   * Connect to ENSDb instance.
   *
   * @returns ENSDb Client
   */
  connect({ schemaName, poolConfig }: EnsDbConnectionOptions): EnsDbClient {
    if (this.#connectionPool) {
      throw new Error("ENSDb already connected. Call disconnect() first.");
    }

    this.#connectionPool = new Pool(poolConfig);

    this.#ensDbClient = makeDrizzle({
      connectionPool: this.#connectionPool,
      databaseSchema: schemaName,
      schema,
    });

    return this.#ensDbClient;
  }

  /**
   * Disconnect to ENSDb instance.
   *
   * Call this function to free up resources.
   */
  async disconnect(): Promise<void> {
    if (!this.#connectionPool) return;

    // Free up resources
    await this.#connectionPool.end();

    this.#connectionPool = undefined;
    this.#ensDbClient = undefined;
  }
}
