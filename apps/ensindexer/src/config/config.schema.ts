import { parse as parseConnectionString } from "pg-connection-string";
import { prettifyError, z } from "zod/v4";

import { ENSIndexerConfig, ENSIndexerEnvironment } from "@/config/types";
import {
  invariant_globalBlockrange,
  invariant_requiredDatasources,
  invariant_rpcConfigsSpecifiedForIndexedChains,
  invariant_validContractConfigs,
} from "@/config/validations";
import {
  DEFAULT_ENSADMIN_URL,
  DEFAULT_ENS_DEPLOYMENT_CHAIN,
  DEFAULT_HEAL_REVERSE_ADDRESSES,
  DEFAULT_INDEX_RESOLVER_RECORDS,
  DEFAULT_PORT,
  DEFAULT_RPC_RATE_LIMIT,
} from "@/lib/lib-config";
import { uniq } from "@/lib/lib-helpers";
import { ENSDeployments } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/utils";

const parseBlockNumber = (envVarKey: string) =>
  z.coerce
    .number({ error: `${envVarKey} must be a positive integer.` })
    .int({ error: `${envVarKey} must be a positive integer.` })
    .min(0, { error: `${envVarKey} must be a positive integer.` })
    .optional();

const parseRpcUrl = () =>
  z.url({
    error:
      "RPC_URL must be a valid URL string (e.g., http://localhost:8080 or https://example.com).",
  });

const parseRpcMaxRequestsPerSecond = () =>
  z.coerce
    .number({ error: "RPC max requests per second must be an integer." })
    .int({ error: "RPC max requests per second must be an integer." })
    .min(1, { error: "RPC max requests per second must be at least 1." })
    .default(DEFAULT_RPC_RATE_LIMIT);

const parseChainConfig = () =>
  z.object({
    url: parseRpcUrl(),
    maxRequestsPerSecond: parseRpcMaxRequestsPerSecond(),
  });

const parseEnsDeploymentChain = () =>
  z
    .enum(Object.keys(ENSDeployments) as [keyof typeof ENSDeployments], {
      error: (issue) => {
        return `Invalid ENS_DEPLOYMENT_CHAIN. Supported ENS deployment chains are: ${Object.keys(
          ENSDeployments,
        ).join(", ")}`;
      },
    })
    .default(DEFAULT_ENS_DEPLOYMENT_CHAIN);

const parseBlockrange = () =>
  z
    .object({
      startBlock: parseBlockNumber("START_BLOCK"),
      endBlock: parseBlockNumber("END_BLOCK"),
    })
    .refine(
      (val) =>
        val.startBlock === undefined || val.endBlock === undefined || val.endBlock > val.startBlock,
      { error: "END_BLOCK must be greater than START_BLOCK." },
    );

const parseEnsNodePublicUrl = () =>
  z.url({
    error:
      "ENSNODE_PUBLIC_URL must be a valid URL string (e.g., http://localhost:8080 or https://example.com).",
  });

const parseEnsAdminUrl = () =>
  z
    .url({
      error:
        "ENSADMIN_URL must be a valid URL string (e.g., http://localhost:8080 or https://example.com).",
    })
    .default(DEFAULT_ENSADMIN_URL);

const parsePonderDatabaseSchema = () =>
  z
    .string({
      error: "DATABASE_SCHEMA is required.",
    })
    .trim()
    .min(1, {
      error: "DATABASE_SCHEMA is required and cannot be an empty string.",
    });

const parsePlugins = () =>
  z.coerce
    .string()
    .transform((val) => val.split(",").filter(Boolean))
    .pipe(
      z
        .array(
          z.enum(PluginName, {
            error: `ACTIVE_PLUGINS must be a comma separated list with at least one valid plugin name. Valid plugins are: ${Object.values(
              PluginName,
            ).join(", ")}`,
          }),
        )
        .min(1, {
          error: `ACTIVE_PLUGINS must be a comma separated list with at least one valid plugin name. Valid plugins are: ${Object.values(
            PluginName,
          ).join(", ")}`,
        }),
    )
    .refine((arr) => arr.length === uniq(arr).length, {
      error: "ACTIVE_PLUGINS cannot contain duplicate values",
    });

const parseHealReverseAddresses = () =>
  z
    .string()
    .pipe(
      z.enum(["true", "false"], {
        error: "HEAL_REVERSE_ADDRESSES must be 'true' or 'false'.",
      }),
    )
    .transform((val) => val === "true")
    .default(DEFAULT_HEAL_REVERSE_ADDRESSES);

const parseIndexResolverRecords = () =>
  z
    .string()
    .pipe(
      z.enum(["true", "false"], {
        error: "INDEX_RESOLVER_RECORDS must be 'true' or 'false'.",
      }),
    )
    .transform((val) => val === "true")
    .default(DEFAULT_INDEX_RESOLVER_RECORDS);

const parsePort = () =>
  z.coerce
    .number({ error: "PORT must be an integer." })
    .int({ error: "PORT must be an integer." })
    .min(1, { error: "PORT must be an integer between 1 and 65535." })
    .max(65535, { error: "PORT must be an integer between 1 and 65535." })
    .default(DEFAULT_PORT);

const parseEnsRainbowEndpointUrl = () =>
  z.url({
    error:
      "ENSRAINBOW_URL must be a valid URL string (e.g., http://localhost:8080 or https://example.com).",
  });

const parseRpcConfigs = () =>
  z.record(z.string().transform(Number), parseChainConfig(), {
    error: "Chains configuration must be an object mapping numeric chain IDs to their configs.",
  });

const parseDatabaseUrl = () =>
  z.union(
    [
      z.string().refine((url) => {
        try {
          if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
            return false;
          }
          const config = parseConnectionString(url);
          return !!(config.host && config.port && config.database);
        } catch {
          return false;
        }
      }),
      z.undefined(),
    ],
    {
      message:
        "Invalid PostgreSQL connection string. Expected format: postgresql://username:password@host:port/database",
    },
  );

const ENSIndexerConfigSchema = z
  .object({
    ensDeploymentChain: parseEnsDeploymentChain(),
    globalBlockrange: parseBlockrange(),
    ensNodePublicUrl: parseEnsNodePublicUrl(),
    ensAdminUrl: parseEnsAdminUrl(),
    ponderDatabaseSchema: parsePonderDatabaseSchema(),
    plugins: parsePlugins(),
    healReverseAddresses: parseHealReverseAddresses(),
    indexResolverRecords: parseIndexResolverRecords(),
    port: parsePort(),
    ensRainbowEndpointUrl: parseEnsRainbowEndpointUrl(),
    rpcConfigs: parseRpcConfigs(),
    databaseUrl: parseDatabaseUrl(),
  })
  .check(invariant_requiredDatasources)
  .check(invariant_rpcConfigsSpecifiedForIndexedChains)
  .check(invariant_globalBlockrange)
  .check(invariant_validContractConfigs);

/**
 * Builds the ENSIndexer configuration object from an ENSIndexerEnvironment object
 *
 * This function then validates the config against the zod schema ensuring that the config
 * meets all type checks and invariants.
 */
export function buildConfigFromEnvironment(environment: ENSIndexerEnvironment): ENSIndexerConfig {
  const parsed = ENSIndexerConfigSchema.safeParse(environment);

  if (!parsed.success) {
    throw new Error(
      "Failed to parse environment configuration: \n" + prettifyError(parsed.error) + "\n",
    );
  }

  return parsed.data;
}
