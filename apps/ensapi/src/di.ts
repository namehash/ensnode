import type { ChainId } from "enssdk";
import type { PublicClient } from "viem";

import { type ENSNamespaceId, getENSRootChainId } from "@ensnode/datasources";
import { type EnsDbConfig, EnsDbReader } from "@ensnode/ensdb-sdk";
import type { EnsNodeStackInfo } from "@ensnode/ensnode-sdk";
import type { RpcConfig } from "@ensnode/ensnode-sdk/internal";

import { type IndexingStatusCache, indexingStatusCache } from "@/cache/indexing-status.cache";
import {
  type ReferralProgramEditionConfigSetCache,
  referralProgramEditionConfigSetCache,
} from "@/cache/referral-program-edition-set.cache";
import type { EnsNodeStackInfoCache } from "@/cache/stack-info.cache";
import { stackInfoCache } from "@/cache/stack-info.cache";
import type { EnsApiConfig } from "@/config/config.schema";
import { buildConfigFromEnvironment, buildRootChainRpcConfig } from "@/config/config.schema";
import { buildEnsDbConfigFromEnvironment } from "@/config/ensdb-config";
import type { EnsApiEnvironment } from "@/config/environment";
import { makeLogger } from "@/lib/logger";
import { buildPublicClient } from "@/lib/public-client";

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

export function buildEnsApiDiContext(ensApiEnvironment: EnsApiEnvironment): EnsApiDiContext {
  const instances = {} as EnsApiDiContext;

  const context = {
    get ensApiConfig(): EnsApiConfig {
      if (instances.ensApiConfig === undefined) {
        instances.ensApiConfig = buildConfigFromEnvironment(ensApiEnvironment);
      }

      return instances.ensApiConfig;
    },

    get ensDbConfig(): EnsDbConfig {
      if (instances.ensDbConfig === undefined) {
        instances.ensDbConfig = buildEnsDbConfigFromEnvironment(ensApiEnvironment);
      }
      return instances.ensDbConfig;
    },

    get ensDbClient(): EnsDbReader {
      if (instances.ensDbClient === undefined) {
        const { ensDbUrl, ensIndexerSchemaName } = context.ensDbConfig;
        instances.ensDbClient = new EnsDbReader(ensDbUrl, ensIndexerSchemaName);
      }

      return instances.ensDbClient;
    },

    get ensDb(): EnsDbReader["ensDb"] {
      return context.ensDbClient.ensDb;
    },

    get ensIndexerSchema(): EnsDbReader["ensIndexerSchema"] {
      return context.ensDbClient.ensIndexerSchema;
    },

    get namespace(): ENSNamespaceId {
      return context.stackInfo.ensIndexer.namespace;
    },

    get rootChainRpcConfig(): RpcConfig {
      if (instances.rootChainRpcConfig === undefined) {
        instances.rootChainRpcConfig = buildRootChainRpcConfig(
          ensApiEnvironment,
          context.namespace,
        );
      }

      return instances.rootChainRpcConfig;
    },

    get rootChainId(): ChainId {
      if (instances.rootChainId === undefined) {
        instances.rootChainId = getENSRootChainId(context.namespace);
      }

      return instances.rootChainId;
    },

    get rootChainPublicClient(): PublicClient {
      if (instances.rootChainPublicClient === undefined) {
        instances.rootChainPublicClient = buildPublicClient(
          context.rootChainRpcConfig,
          context.namespace,
        );
      }

      return instances.rootChainPublicClient;
    },

    get indexingStatusCache(): IndexingStatusCache {
      if (instances.indexingStatusCache === undefined) {
        instances.indexingStatusCache = indexingStatusCache;
      }

      return instances.indexingStatusCache;
    },

    get referralProgramEditionConfigSetCache(): ReferralProgramEditionConfigSetCache {
      if (instances.referralProgramEditionConfigSetCache === undefined) {
        instances.referralProgramEditionConfigSetCache = referralProgramEditionConfigSetCache;
      }

      return instances.referralProgramEditionConfigSetCache;
    },

    get stackInfoCache(): EnsNodeStackInfoCache {
      if (instances.stackInfoCache === undefined) {
        instances.stackInfoCache = stackInfoCache;
      }

      return instances.stackInfoCache;
    },

    /**
     * Synchronous getter for stack info that reads from the stackInfoCache.
     *
     * Note: This assumes that the stack info has already been loaded into the cache
     * (e.g. by calling `di.context.stackInfoCache.read()` during ENSApi startup).
     */
    get stackInfo(): EnsNodeStackInfo {
      const stackInfo = context.stackInfoCache.peek();

      if (stackInfo instanceof Error) {
        throw stackInfo;
      }

      return stackInfo;
    },
  } satisfies EnsApiDiContext;

  return context;
}

/**
 * Dependency Injection Container class for ENSApi
 *
 * It allows for lazy loading of the DI context and provides methods to
 * initialize and destroy resources as needed.
 *
 * The lifecycle of the DI container is managed manually by calling
 * the `init()` and `destroy()` methods, which allows for flexibility
 * in when resources are initialized and cleaned up, such as during application
 * startup and shutdown.
 *
 * @example
 * ```ts
 * const di = new EnsApiDiContainer();
 * di.init(); // Initializes the DI context and any necessary resources
 * const namespace = di.context.namespace; // Access a member of the DI context
 * di.destroy(); // Clean up resources when they are no longer needed
 * ```
 */
class EnsApiDiContainer {
  private _context: EnsApiDiContext | undefined;
  /**
   * The DI context for ENSApi, which is lazily loaded on first access.
   *
   * Note: the context can be re-loaded by calling {@link di.loadContext()}.
   */
  get context(): EnsApiDiContext {
    if (!this._context) {
      throw new Error(
        "DI context has not been loaded yet. Call `di.init()` to load the context and initialize necessary resources.",
      );
    }
    return this._context;
  }

  /**
   * Initializes the DI container by loading the context and initializing
   * necessary resources that need to be evaluated eagerly, such as
   * ENSDb client, caches, RPC client for the ENS Root Chain, etc.
   */
  async init(): Promise<void> {
    if (this._context) {
      throw new Error(
        "DI context has already been initialized. If you want to re-initialize, call `di.destroy()` first to clean up resources.",
      );
    }

    // Load the DI context
    this.loadContext();

    try {
      // Initialize the ENSDb client and verify connectivity to the database.
      logger.info("Initializing ENSDb client and verifying connectivity to ENSDb");
      const isEnsDbHealthy = await this.context.ensDbClient.isHealthy();

      if (!isEnsDbHealthy) {
        throw new Error("ENSDb health check failed");
      }

      logger.info(
        { ensIndexerSchemaName: this.context.ensDbConfig.ensIndexerSchemaName },
        "Successfully connected to ENSDb",
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `DI container initialization failed: could not connect to ENSDb due to ${errorMessage}`,
      );
    }

    try {
      // Initialize caches
      logger.info("Initializing caches");
      const [indexingStatus, stackInfo, referralProgramEditionConfigSet] = await Promise.all([
        this.context.indexingStatusCache.read(),
        this.context.stackInfoCache.read(),
        this.context.referralProgramEditionConfigSetCache.read(),
      ]);
      logger.info(
        { indexingStatus, stackInfo, referralProgramEditionConfigSet },
        "Caches initialized",
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `DI container initialization failed: cache initialization error due to ${errorMessage}`,
      );
    }

    // Initialize the RPC client for the ENS Root Chain by making a simple call to
    // verify connectivity.
    try {
      logger.info("Initializing RPC client for the ENS Root Chain");
      await this.context.rootChainPublicClient.getBlockNumber();
      logger.info(
        { rootChainId: this.context.rootChainId },
        "Successfully connected to the ENS Root Chain RPC",
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `DI container initialization failed: could not connect to ENS Root Chain RPC due to ${errorMessage}`,
      );
    }
  }

  /**
   * Destroys any resources held by the DI container, such as caches, to
   * allow for clean shutdown or re-initialization.
   */
  async destroy(): Promise<void> {
    if (!this._context) {
      logger.warn(
        "DI context is not loaded, so there are no resources to destroy. If you are trying to reload the context, call `di.init()` to load the context and initialize necessary resources.",
      );

      return;
    }

    logger.info("Destroying caches");
    this.context.stackInfoCache.destroy();
    this.context.indexingStatusCache.destroy();
    this.context.referralProgramEditionConfigSetCache.destroy();
    logger.info("Caches destroyed");

    // Destroy the ENSDb client to close the connection pool to ENSDb
    await this.context.ensDbClient.destroy();
    logger.info("ENSDb client destroyed");

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
  private loadContext(): void {
    if (this._context) {
      throw new Error(
        "DI context has already been loaded. If you want to reload the context, call `di.destroy()` first to clean up resources.",
      );
    }

    logger.info("Loading context");

    // Load the current environment variables into the DI context
    // and freeze the context to prevent modification at runtime
    this._context = Object.freeze(buildEnsApiDiContext(process.env));

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
