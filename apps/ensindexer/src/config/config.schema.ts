import { ENSDeployments } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/utils";
import * as z from "zod";

export const DEFAULT_RPC_RATE_LIMIT = 50;
export const DEFAULT_ENSADMIN_URL = "https://admin.ensnode.io";
export const DEFAULT_PORT = 42069;
export const DEFAULT_HEAL_REVERSE_ADDRESSES = true;
export const DEFAULT_DEPLOYMENT = "mainnet";

// This validates URLs but also accepts localhost URLs. The zod equivalent of this is .url()
// but it doesn't accept localhost URLs.
// Issue here: https://github.com/colinhacks/zod/issues/4103
// Once this is fixed we should be able to use .url() instead with custom errors.
const url = (envVarKey: string) => {
  return (
    z
      .string({
        // This error handler is primarily for the case where the input is not a string type at all
        // (e.g., undefined if it wasn't handled by a .default() before this schema, or a number).
        error: (issue) => {
          if (issue.code === "invalid_type") {
            return `${envVarKey} must be a string. Received type: ${typeof issue.input}.`;
          }
          // This is a fallback if it's a string but somehow fails the base string check
          // before .min() or .refine() are even reached (less common).
          return `${envVarKey} has an invalid string value. Please check the format.`;
        },
      })
      // Step 1: Ensure the string, if provided, is not empty or just whitespace.
      // The .trim() method is applied first, then .min(1) checks the length of the trimmed string.
      .trim()
      .min(1, { error: `${envVarKey} is required and cannot be empty.` })
      // Step 2: If the string is non-empty, then try to parse it as a URL.
      // This .refine() will only execute if the .min(1) check (on the trimmed string) passes.
      .refine(
        (val) => {
          // val is guaranteed by .min(1) to be a non-empty string at this point.
          try {
            new URL(val);
            return true;
          } catch {
            return false;
          }
        },
        {
          // This message is for when the string is non-empty but not a valid URL format.
          error: `${envVarKey} must be a valid URL string (e.g., http://localhost:8080 or https://example.com).`,
        },
      )
  );
};

const ChainConfigSchema = z.object({
  rpcEndpointUrl: url("RPC_URL"),

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

  ensNodePublicUrl: url("ENSNODE_PUBLIC_URL"),

  ensAdminUrl: url("ENSADMIN_URL").default(DEFAULT_ENSADMIN_URL),

  ponderDatabaseSchema: z
    .string({
      error: "DATABASE_SCHEMA is required.",
    })
    .trim()
    .min(1, {
      error: "DATABASE_SCHEMA is required and cannot be an empty string.",
    }),

  requestedPluginNames: z.coerce
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

  ensRainbowEndpointUrl: url("ENSRAINBOW_URL"),

  indexedChains: z.record(z.string().transform(Number), ChainConfigSchema, {
    error: "Chains configuration must be an object mapping numeric chain IDs to their configs.",
  }),
});
