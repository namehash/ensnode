import type { ChainId } from "enssdk";
import { createPublicClient, fallback, http, type PublicClient } from "viem";

import { type ENSNamespaceId, getENSRootChainId } from "@ensnode/datasources";
import type { EnsDbConfig, EnsDbReader } from "@ensnode/ensdb-sdk";
import type { EnsNodeStackInfo } from "@ensnode/ensnode-sdk";
import type { RpcConfig } from "@ensnode/ensnode-sdk/internal";
import { subgraphGraphQLMiddleware } from "@ensnode/ponder-subgraph";

import { type IndexingStatusCache, indexingStatusCache } from "@/cache/indexing-status.cache";
import {
  type ReferralProgramEditionConfigSetCache,
  referralProgramEditionConfigSetCache,
} from "@/cache/referral-program-edition-set.cache";
import type { EnsNodeStackInfoCache } from "@/cache/stack-info.cache";
import { stackInfoCache } from "@/cache/stack-info.cache";
import type { EnsApiConfig } from "@/config/config.schema";
import { buildConfigFromEnvironment, buildRootChainRpcConfig } from "@/config/config.schema";
import ensDbConfig from "@/config/ensdb-config";
import type { EnsApiEnvironment } from "@/config/environment";
import { ensDbClient } from "@/lib/ensdb/singleton";
import { makeLogger } from "@/lib/logger";
import { filterSchemaByPrefix } from "@/lib/subgraph/filter-schema-by-prefix";

const logger = makeLogger("di");

/**
 * Dependency Injection Container for ENSApi.
 */
export interface EnsApiDiContext {
  /**
   * The environment variables for ENSApi.
   */
  ensApiEnvironment: EnsApiEnvironment;

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
  ensNamespaceId: ENSNamespaceId;

  /**
   * Chain ID of the ENS Root Chain for the {@link ensNamespaceId}.
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

  subgraphApiGqlMiddleware: ReturnType<typeof subgraphGraphQLMiddleware>;
}

export function buildEnsApiDiContext(env: NodeJS.ProcessEnv): EnsApiDiContext {
  const instances = {} as EnsApiDiContext;

  const context = {
    get ensApiEnvironment(): EnsApiEnvironment {
      return env;
    },

    get ensApiConfig(): EnsApiConfig {
      if (!instances.ensApiConfig) {
        instances.ensApiConfig = buildConfigFromEnvironment(env);
      }

      return instances.ensApiConfig;
    },

    get ensDbConfig(): EnsDbConfig {
      if (!instances.ensDbConfig) {
        instances.ensDbConfig = ensDbConfig;
      }
      return instances.ensDbConfig;
    },

    get ensDbClient(): EnsDbReader {
      return ensDbClient;
    },

    get ensDb(): EnsDbReader["ensDb"] {
      return context.ensDbClient.ensDb;
    },

    get ensIndexerSchema(): EnsDbReader["ensIndexerSchema"] {
      return context.ensDbClient.ensIndexerSchema;
    },

    get ensNamespaceId(): ENSNamespaceId {
      return context.stackInfo.ensIndexer.namespace;
    },

    get rootChainRpcConfig(): RpcConfig {
      if (!instances.rootChainRpcConfig) {
        instances.rootChainRpcConfig = buildRootChainRpcConfig(
          context.ensApiEnvironment,
          context.ensNamespaceId,
        );
      }

      return instances.rootChainRpcConfig;
    },

    get rootChainId(): ChainId {
      if (!instances.rootChainId) {
        instances.rootChainId = getENSRootChainId(context.ensNamespaceId);
      }

      return instances.rootChainId;
    },

    get rootChainPublicClient(): PublicClient {
      if (!instances.rootChainPublicClient) {
        // Create an viem#PublicClient that uses a fallback() transport with all specified HTTP RPCs
        instances.rootChainPublicClient = createPublicClient({
          transport: fallback(
            context.rootChainRpcConfig.httpRPCs.map((url) => http(url.toString())),
          ),
        });
      }

      return instances.rootChainPublicClient;
    },

    get indexingStatusCache(): IndexingStatusCache {
      if (!instances.indexingStatusCache) {
        instances.indexingStatusCache = indexingStatusCache;
      }

      return instances.indexingStatusCache;
    },

    get referralProgramEditionConfigSetCache(): ReferralProgramEditionConfigSetCache {
      if (!instances.referralProgramEditionConfigSetCache) {
        instances.referralProgramEditionConfigSetCache = referralProgramEditionConfigSetCache;
      }

      return instances.referralProgramEditionConfigSetCache;
    },

    get stackInfoCache(): EnsNodeStackInfoCache {
      if (!instances.stackInfoCache) {
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
        throw new Error("Stack info is not available in the stackInfoCache.");
      }

      return stackInfo;
    },

    get subgraphApiGqlMiddleware(): ReturnType<typeof subgraphGraphQLMiddleware> {
      if (!instances.subgraphApiGqlMiddleware) {
        // generate a subgraph-specific subset of the schema
        const subgraphSchema = filterSchemaByPrefix("subgraph_", context.ensIndexerSchema);

        instances.subgraphApiGqlMiddleware = subgraphGraphQLMiddleware({
          databaseUrl: context.ensDbConfig.ensDbUrl,
          databaseSchema: context.ensDbConfig.ensIndexerSchemaName,
          schema: subgraphSchema,
          // describes the polymorphic (interface) relationships in the schema
          polymorphicConfig: {
            types: {
              DomainEvent: [
                subgraphSchema.transfer,
                subgraphSchema.newOwner,
                subgraphSchema.newResolver,
                subgraphSchema.newTTL,
                subgraphSchema.wrappedTransfer,
                subgraphSchema.nameWrapped,
                subgraphSchema.nameUnwrapped,
                subgraphSchema.fusesSet,
                subgraphSchema.expiryExtended,
              ],
              RegistrationEvent: [
                subgraphSchema.nameRegistered,
                subgraphSchema.nameRenewed,
                subgraphSchema.nameTransferred,
              ],
              ResolverEvent: [
                subgraphSchema.addrChanged,
                subgraphSchema.multicoinAddrChanged,
                subgraphSchema.nameChanged,
                subgraphSchema.abiChanged,
                subgraphSchema.pubkeyChanged,
                subgraphSchema.textChanged,
                subgraphSchema.contenthashChanged,
                subgraphSchema.interfaceChanged,
                subgraphSchema.authorisationChanged,
                subgraphSchema.versionChanged,
              ],
            },
            fields: {
              "Domain.events": "DomainEvent",
              "Registration.events": "RegistrationEvent",
              "Resolver.events": "ResolverEvent",
            },
          },
        });
      }

      return instances.subgraphApiGqlMiddleware;
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
 * const ensNamespaceId = di.context.ensNamespaceId; // Access a member of the DI context
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
   * necessary resources.
   */
  init(): void {
    if (this._context) {
      throw new Error(
        "DI context has already been initialized. If you want to re-initialize, call `di.destroy()` first to clean up resources.",
      );
    }

    // Load the DI context
    this.loadContext();

    logger.info("Initializing caches");
    void Promise.all([
      this.context.indexingStatusCache.read(),
      this.context.stackInfoCache.read(),
      this.context.referralProgramEditionConfigSetCache.read(),
    ]).then(() => logger.info("Caches initialized"));
  }

  /**
   * Destroys any resources held by the DI container, such as caches, to
   * allow for clean shutdown or re-initialization.
   */
  destroy(): void {
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
