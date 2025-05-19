import { ENSDeployments } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/utils";
import { z } from "zod/v4";

export const DEFAULT_RPC_RATE_LIMIT = 50;
export const DEFAULT_ENSADMIN_URL = "https://admin.ensnode.io";
export const DEFAULT_PORT = 42069;
export const DEFAULT_HEAL_REVERSE_ADDRESSES = true;
export const DEFAULT_DEPLOYMENT = "mainnet";

const ChainConfigSchema = z.object({
  rpcEndpointUrl: z.url({
    error:
      "RPC_URL must be a valid URL string (e.g., http://localhost:8080 or https://example.com).",
  }),

  rpcMaxRequestsPerSecond: z.coerce
    .number({ error: "RPC max requests per second must be an integer." })
    .int({ error: "RPC max requests per second must be an integer." })
    .min(1, { error: "RPC max requests per second must be at least 1." })
    .default(DEFAULT_RPC_RATE_LIMIT),
});

const BlockNumberSchema = (envVarKey: string) =>
  z.coerce
    .number({ error: `${envVarKey} must be a positive integer.` })
    .int({ error: `${envVarKey} must be a positive integer.` })
    .min(0, { error: `${envVarKey} must be a positive integer.` })
    .optional();

export const ENSIndexerConfigSchema = z.object({
  ensDeploymentChain: z
    .enum(Object.keys(ENSDeployments) as [keyof typeof ENSDeployments], {
      error: (issue) => {
        return `Invalid ENS_DEPLOYMENT_CHAIN. Supported chains are: ${Object.keys(
          ENSDeployments,
        ).join(", ")}`;
      },
    })
    .default(DEFAULT_DEPLOYMENT),

  globalBlockrange: z
    .object({
      startBlock: BlockNumberSchema("START_BLOCK"),
      endBlock: BlockNumberSchema("END_BLOCK"),
    })
    .refine(
      (val) =>
        val.startBlock === undefined ||
        val.endBlock === undefined ||
        val.startBlock <= val.endBlock,
      { error: "END_BLOCK must be greater than or equal to START_BLOCK." },
    ),

  ensNodePublicUrl: z.url({
    error:
      "ENSNODE_PUBLIC_URL must be a valid URL string (e.g., http://localhost:8080 or https://example.com).",
  }),

  ensAdminUrl: z
    .url({
      error:
        "ENSADMIN_URL must be a valid URL string (e.g., http://localhost:8080 or https://example.com).",
    })
    .default(DEFAULT_ENSADMIN_URL),

  ponderDatabaseSchema: z
    .string({
      error: "DATABASE_SCHEMA is required.",
    })
    .trim()
    .min(1, {
      error: "DATABASE_SCHEMA is required and cannot be an empty string.",
    }),

  plugins: z.coerce
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
    ),

  healReverseAddresses: z
    .string()
    .pipe(
      z.enum(["true", "false"], {
        error: "HEAL_REVERSE_ADDRESSES must be 'true' or 'false'.",
      }),
    )
    .transform((val) => val === "true")
    .default(DEFAULT_HEAL_REVERSE_ADDRESSES),

  port: z.coerce
    .number({ error: "PORT must be an integer." })
    .int({ error: "PORT must be an integer." })
    .min(1, { error: "PORT must be an integer between 1 and 65535." })
    .max(65535, { error: "PORT must be an integer between 1 and 65535." })
    .default(DEFAULT_PORT),

  ensRainbowEndpointUrl: z.url({
    error:
      "ENSRAINBOW_URL must be a valid URL string (e.g., http://localhost:8080 or https://example.com).",
  }),

  indexedChains: z.record(z.string().transform(Number), ChainConfigSchema, {
    error: "Chains configuration must be an object mapping numeric chain IDs to their configs.",
  }),
});
