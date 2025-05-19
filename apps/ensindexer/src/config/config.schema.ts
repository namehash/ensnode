import { type ENSDeploymentGlobalType, ENSDeployments } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/utils";
import { parse as parseConnectionString } from "pg-connection-string";
import { z } from "zod/v4";

export const DEFAULT_RPC_RATE_LIMIT = 50;
export const DEFAULT_ENSADMIN_URL = "https://admin.ensnode.io";
export const DEFAULT_PORT = 42069;
export const DEFAULT_HEAL_REVERSE_ADDRESSES = true;
export const DEFAULT_DEPLOYMENT = "mainnet";

const parseBlockNumber = (envVarKey: string) =>
  z.coerce
    .number({ error: `${envVarKey} must be a positive integer.` })
    .int({ error: `${envVarKey} must be a positive integer.` })
    .min(0, { error: `${envVarKey} must be a positive integer.` })
    .optional();

const parseRpcEndpointUrl = () =>
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
    rpcEndpointUrl: parseRpcEndpointUrl(),
    rpcMaxRequestsPerSecond: parseRpcMaxRequestsPerSecond(),
  });

const parseEnsDeploymentChain = () =>
  z
    .enum(Object.keys(ENSDeployments) as [keyof typeof ENSDeployments], {
      error: (issue) => {
        return `Invalid ENS_DEPLOYMENT_CHAIN. Supported chains are: ${Object.keys(
          ENSDeployments,
        ).join(", ")}`;
      },
    })
    .default(DEFAULT_DEPLOYMENT);

const parseGlobalBlockrange = () =>
  z
    .object({
      startBlock: parseBlockNumber("START_BLOCK"),
      endBlock: parseBlockNumber("END_BLOCK"),
    })
    .refine(
      (val) =>
        val.startBlock === undefined ||
        val.endBlock === undefined ||
        val.startBlock <= val.endBlock,
      { error: "END_BLOCK must be greater than or equal to START_BLOCK." },
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
    .refine((arr) => arr.length === new Set(arr).size, {
      error: "ACTIVE_PLUGINS cannot contain duplicate values",
    })
    .transform((arr) => new Set(arr));

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

const parseIndexedChains = () =>
  z.record(z.string().transform(Number), parseChainConfig(), {
    error: "Chains configuration must be an object mapping numeric chain IDs to their configs.",
  });

const parseDatabaseUrl = () =>
  z.coerce.string().refine(
    (url) => {
      try {
        if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
          return false;
        }
        const config = parseConnectionString(url);
        return !!(config.host && config.port && config.database);
      } catch {
        return false;
      }
    },
    {
      message:
        "Invalid PostgreSQL connection string. Expected format: postgresql://username:password@host:port/database",
    },
  );

const parseSelectedEnsDeployment = () => z.custom<ENSDeploymentGlobalType>();

export const ENSIndexerConfigSchema = z.object(
  {
    ensDeploymentChain: parseEnsDeploymentChain(),
    globalBlockrange: parseGlobalBlockrange(),
    ensNodePublicUrl: parseEnsNodePublicUrl(),
    ensAdminUrl: parseEnsAdminUrl(),
    ponderDatabaseSchema: parsePonderDatabaseSchema(),
    plugins: parsePlugins(),
    healReverseAddresses: parseHealReverseAddresses(),
    port: parsePort(),
    ensRainbowEndpointUrl: parseEnsRainbowEndpointUrl(),
    indexedChains: parseIndexedChains(),
    databaseUrl: parseDatabaseUrl(),
    selectedEnsDeployment: parseSelectedEnsDeployment(),
  },
  {
    error: "Indexed chains must include all chains in the selected deployment.",
  },
);
