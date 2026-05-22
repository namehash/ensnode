import type { ChainId } from "enssdk";
import { createPublicClient, fallback, http, type PublicClient } from "viem";

import { getENSRootChainId } from "@ensnode/datasources";
import { type EnsDbConfig, EnsDbReader } from "@ensnode/ensdb-sdk";
import type { ENSNamespaceId, EnsNodeStackInfo } from "@ensnode/ensnode-sdk";
import type { RpcConfig } from "@ensnode/ensnode-sdk/internal";

import { type IndexingStatusCache, indexingStatusCache } from "@/cache/indexing-status.cache";
import {
  type ReferralProgramEditionConfigSetCache,
  referralProgramEditionConfigSetCache,
} from "@/cache/referral-program-edition-set.cache";
import { type EnsNodeStackInfoCache, stackInfoCache } from "@/cache/stack-info.cache";
import {
  buildConfigFromEnvironment,
  buildRootChainRpcConfig,
  type EnsApiConfig,
} from "@/config/config.schema";
import { buildEnsDbConfigFromEnvironment } from "@/config/ensdb-config";
import type { EnsApiEnvironment } from "@/config/environment";
import { clearBootstrapDeps, setBootstrapDeps } from "@/di-bootstrap";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("di");

/**
 * Dependency Injection Container for ENSApi.
 */
export interface EnsApiDiContext {
  /**
   * The ENSApi config.
   */
  ensApiConfig: EnsApiConfig;

  /**
   * The ENSDb config to be used by ENSApi.
   */
  ensDbConfig: EnsDbConfig;

  /**
   * The ENSDb client to be used by ENSApi for ENSDb access.
   */
  ensDbClient: EnsDbReader;

  /**
   * Alias for {@link ensDbClient.ensDb} to simplify access to the actual database connection.
   */
  ensDb: EnsDbReader["ensDb"];

  /**
   * Alias for {@link ensDbClient.ensIndexerSchema} to simplify access to the ENSIndexer Schema.
   */
  ensIndexerSchema: EnsDbReader["ensIndexerSchema"];

  /**
   * The ENS Namespace ID used by the ENSApi instance.
   */
  namespace: ENSNamespaceId;

  /**
   * Chain ID of the ENS Root Chain for the {@link namespace}.
   */
  rootChainId: ChainId;

  /**
   * RPC config for the ENS Root Chain.
   */
  rootChainRpcConfig: RpcConfig;

  /**
   * A cached instance of viem's {@link PublicClient} for the ENS Root Chain.
   */
  rootChainPublicClient: PublicClient;

  /**
   * Singleton {@link IndexingStatusCache} instance to be used across ENSApi.
   */
  indexingStatusCache: IndexingStatusCache;

  /**
   * Singleton {@link ReferralProgramEditionConfigSetCache} instance to be used across ENSApi.
   */
  referralProgramEditionConfigSetCache: ReferralProgramEditionConfigSetCache;

  /**
   * Singleton {@link EnsNodeStackInfoCache} instance to be used across ENSApi.
   */
  stackInfoCache: EnsNodeStackInfoCache;

  /**
   * Synchronous getter for {@link EnsNodeStackInfo} that reads from the {@link stackInfoCache}.
   */
  stackInfo: EnsNodeStackInfo;
}

export async function buildEnsApiDiContext(
  ensApiEnvironment: EnsApiEnvironment,
): Promise<EnsApiDiContext> {
  const ensApiConfig = buildConfigFromEnvironment(ensApiEnvironment);
  const ensDbConfig = buildEnsDbConfigFromEnvironment(ensApiEnvironment);
  const ensDbClient = new EnsDbReader(ensDbConfig.ensDbUrl, ensDbConfig.ensIndexerSchemaName);
  const ensDb = ensDbClient.ensDb;
  const ensIndexerSchema = ensDbClient.ensIndexerSchema;

  setBootstrapDeps({ ensDbClient, ensApiConfig });
  try {
    logger.info("Initializing caches");
    await Promise.all([
      stackInfoCache.read(),
      indexingStatusCache.read(),
      referralProgramEditionConfigSetCache.read(),
    ]);
    logger.info("Caches initialized");

    const stackInfoPeek = stackInfoCache.peek();
    if (stackInfoPeek instanceof Error) {
      throw stackInfoPeek;
    }
    const stackInfo: EnsNodeStackInfo = stackInfoPeek;

    const namespace = stackInfo.ensIndexer.namespace;
    const rootChainRpcConfig = buildRootChainRpcConfig(ensApiEnvironment, namespace);
    const rootChainId: ChainId = getENSRootChainId(namespace);
    const rootChainPublicClient: PublicClient = createPublicClient({
      transport: fallback(rootChainRpcConfig.httpRPCs.map((url) => http(url.toString()))),
    });

    return {
      ensApiConfig,
      ensDbConfig,
      ensDbClient,
      ensDb,
      ensIndexerSchema,
      namespace,
      rootChainId,
      rootChainRpcConfig,
      rootChainPublicClient,
      indexingStatusCache,
      referralProgramEditionConfigSetCache,
      stackInfoCache,
      stackInfo,
    } satisfies EnsApiDiContext;
  } finally {
    clearBootstrapDeps();
  }
}

/**
 * Dependency Injection Container class for ENSApi
 *
 * The lifecycle of the DI container is managed manually by calling
 * the `init()` and `destroy()` methods, which allows for flexibility
 * in when resources are initialized and cleaned up, such as during application
 * startup and shutdown.
 *
 * @example
 * ```ts
 * const di = new EnsApiDiContainer();
 * await di.init();
 * const namespace = di.context.namespace;
 * await di.destroy();
 * ```
 */
class EnsApiDiContainer {
  private _context: EnsApiDiContext | undefined;
  /**
   * The DI context for ENSApi, available after {@link init} completes.
   */
  get context(): EnsApiDiContext {
    if (!this._context) {
      throw new Error(
        "DI context has not been loaded yet. Call `await di.init()` to load the context and initialize necessary resources.",
      );
    }
    return this._context;
  }

  /**
   * Initializes the DI container by loading the context and initializing
   * necessary resources.
   */
  async init(): Promise<void> {
    if (this._context) {
      throw new Error(
        "DI context has already been initialized. If you want to re-initialize, call `di.destroy()` first to clean up resources.",
      );
    }

    await this.loadContext();
  }

  /**
   * Destroys any resources held by the DI container, such as caches, to
   * allow for clean shutdown or re-initialization.
   */
  destroy(): void {
    if (!this._context) {
      logger.warn(
        "DI context is not loaded, so there are no resources to destroy. If you are trying to reload the context, call `await di.init()` to load the context and initialize necessary resources.",
      );

      return;
    }

    logger.info("Destroying caches");
    this.context.stackInfoCache.destroy();
    this.context.indexingStatusCache.destroy();
    this.context.referralProgramEditionConfigSetCache.destroy();
    logger.info("Caches destroyed");

    this._context = undefined;
  }

  /**
   * Loads the DI context by building it from the environment variables and
   * freezing it to prevent modification at runtime.
   *
   * Note: useful for testing purposes to reset the DI context between tests,
   * or during hot-reloading in development to reload the context.
   *
   * @throws Error if the context has already been loaded to prevent accidental
   *         overwriting of the context. Call `di.destroy()` first to clean up
   *         resources if you want to reload the context.
   */
  private async loadContext(): Promise<void> {
    if (this._context) {
      throw new Error(
        "DI context has already been loaded. If you want to reload the context, call `di.destroy()` first to clean up resources.",
      );
    }

    logger.info("Loading context");

    // Load the current environment variables into the DI context
    // and freeze the context to prevent modification at runtime
    this._context = Object.freeze(await buildEnsApiDiContext(process.env));

    logger.info(
      { context: Object.keys(this.context) },
      "Context loaded, available members at `di.context` are",
    );
  }
}

/**
 * The singleton instance of the {@link EnsApiDiContainer} for ENSApi.
 */
const di = new EnsApiDiContainer();

export default di;
