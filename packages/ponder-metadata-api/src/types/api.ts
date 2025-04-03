import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";
import type { ReadonlyDrizzle } from "ponder";
import type { PublicClient } from "viem";

import type { BlockInfo } from "@/types/common";

export type PonderEnvVarsInfo = Record<string, unknown>;
export interface PonderMetadataMiddlewareOptions<AppInfo, EnvVars extends PonderEnvVarsInfo> {
  /** Database access object (readonly Drizzle) */
  db: ReadonlyDrizzle<Record<string, unknown>>;

  /** Application info */
  app: AppInfo;

  /** Environment settings info */
  env: EnvVars;

  /** Query methods */
  query: {
    /** Fetches prometheus metrics for Ponder application */
    prometheusMetrics(): Promise<string>;

    /** Fetches the first block do be indexed for a requested chain ID */
    firstBlockToIndexByChainId(chainId: number, publicClient: PublicClient): Promise<BlockInfo>;

    /** Fetches ENSRainbow version information */
    ensRainbowVersion?(): Promise<EnsRainbow.VersionInfo>;
  };

  /** Public clients for each blockchain network fetching data */
  publicClients: Record<number, PublicClient>;
}

export interface PonderMetadataMiddlewareResponse<
  AppInfo,
  EnvVarsInfo extends PonderEnvVarsInfo,
  RuntimeInfo,
> {
  /** Application info */
  app: AppInfo;

  /** Dependencies info */
  deps: {
    /** Ponder application version */
    ponder: string;

    /** Node.js runtime version */
    nodejs: string;
  };

  /** Environment settings info */
  env: EnvVarsInfo;

  /** Runtime status info */
  runtime: RuntimeInfo;
}
