import type { ReadonlyDrizzle } from "ponder";
import type { PublicClient } from "viem";
import type { BlockInfo, NetworkIndexingStatus } from "./common";

export interface PonderMetadataMiddlewareOptions {
  /** database access object (readonly Drizzle) */
  db: ReadonlyDrizzle<Record<string, unknown>>;
  /** application info */
  app: {
    /** application name */
    name: string;
    /** application version */
    version: string;
  };
  /** environment settings info */
  env: {
    /** database schema name is required setting */
    DATABASE_SCHEMA: string;

    /** active plugins */
    ACTIVE_PLUGINS: string;

    /** ENS deployment chain */
    ENS_DEPLOYMENT_CHAIN: string;
  } & Record<string, unknown>;
  /** query methods */
  query: {
    /** fetches prometheus metrics for Ponder application */
    prometheusMetrics(): Promise<string>;

    /** fetches the first block do be indexed for a requested chain ID */
    firstBlockToIndexByChainId(chainId: number, publicClient: PublicClient): Promise<BlockInfo>;
  };
  /** public clients for each blockchain network fetching data */
  publicClients: Record<number, PublicClient>;
}

export interface PonderMetadataMiddlewareResponse {
  /** application info */
  app: PonderMetadataMiddlewareOptions["app"];
  /** dependencies settings info */
  deps: {
    ponder: string;
    nodejs: string;
  };
  /** environment settings info */
  env: PonderMetadataMiddlewareOptions["env"];
  /** runtime status info */
  runtime: {
    /**
     * application build id
     * https://github.com/ponder-sh/ponder/blob/626e524/packages/core/src/build/index.ts#L425-L431
     **/
    codebaseBuildId: string;

    /** network indexing status by chain ID */
    networkIndexingStatusByChainId: Record<number, NetworkIndexingStatus>;
  };
}
