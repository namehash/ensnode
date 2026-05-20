import ensApiConfig from "@/config";

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
import ensDbConfig from "@/config/ensdb-config";
import type { EnsApiEnvironment } from "@/config/environment";
import { ensDbClient } from "@/lib/ensdb/singleton";
import { filterSchemaByPrefix } from "@/lib/subgraph/filter-schema-by-prefix";

/**
 * Dependency Injection Container for ENSApi.
 */
export interface EnsApiDiContext {
  ensApiEnvironment: EnsApiEnvironment;

  ensApiConfig: EnsApiConfig;

  ensDbConfig: EnsDbConfig;

  ensDbClient: EnsDbReader;

  ensDb: EnsDbReader["ensDb"];

  ensIndexerSchema: EnsDbReader["ensIndexerSchema"];

  ensNamespaceId: ENSNamespaceId;

  rootChainId: ChainId;

  rootChainRpcConfig: RpcConfig;

  rootChainPublicClient: PublicClient;

  indexingStatusCache: IndexingStatusCache;

  referralProgramEditionConfigSetCache: ReferralProgramEditionConfigSetCache;

  stackInfoCache: EnsNodeStackInfoCache;

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
        instances.ensApiConfig = ensApiConfig;
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

    get rootChainId(): ChainId {
      if (!instances.rootChainId) {
        instances.rootChainId = getENSRootChainId(context.ensNamespaceId);
      }

      return instances.rootChainId;
    },

    get rootChainRpcConfig(): RpcConfig {
      if (!instances.rootChainRpcConfig) {
        const rpcConfig = context.ensApiConfig.rpcConfigs.get(context.rootChainId);

        if (!rpcConfig) {
          throw new Error(
            `RPC configuration for root chain (chainId: ${context.rootChainId}) is required but was not found in the environment variables.`,
          );
        }

        instances.rootChainRpcConfig = rpcConfig;
      }

      return instances.rootChainRpcConfig;
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

const di = {
  get context(): Readonly<EnsApiDiContext> {
    return Object.freeze(buildEnsApiDiContext(process.env));
  },
};

export default di;
