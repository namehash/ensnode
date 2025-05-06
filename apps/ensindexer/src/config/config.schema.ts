import { ENSDeployments } from "@ensnode/ens-deployments";
import { DEFAULT_ENSRAINBOW_URL } from "@ensnode/ensrainbow-sdk";
import * as z from "zod";

// TODO: This is declared somewhere else, remove it in the other place.
export const DEFAULT_RPC_RATE_LIMIT = 50;
export const DEFAULT_ENSADMIN_URL = "https://admin.ensnode.io";
export const DEFAULT_DATABASE_SCHEMA = "public";
export const DEFAULT_PORT = 42069;
export const DEFAULT_HEAL_REVERSE_ADDRESSES = true;

// Custom URL schema to allow localhost urls and provide clear errors
const customUrlSchema = (envVarKey: string) => {
  return (
    z
      .string({
        // This error handler is for when the input is not even a string.
        error: (issue) => {
          if (issue.code === "invalid_type") {
            return `${envVarKey} must be a string. Received: ${typeof issue.input}.`;
          }
          // Fallback for other unexpected string errors, though less likely.
          return `${envVarKey} has an invalid string value.`;
        },
      })
      // First refinement: Ensure the string is not empty after basic type check.
      // This should be the primary check for "required and not empty".
      .refine((val) => val.trim() !== "", {
        error: `${envVarKey} is required and cannot be empty.`,
      })
      // Second refinement: Check if the non-empty string is a valid URL format.
      // This will only run if the first refine (non-empty check) passes.
      .refine(
        (val) => {
          try {
            new URL(val); // val is already confirmed to be a non-empty string here
            return true;
          } catch {
            return false;
          }
        },
        {
          error: `${envVarKey} must be a valid URL string (e.g. http://localhost:8080 or https://example.com).`,
        }
      )
  );
};

const ChainConfigSchema = z.object({
  rpcEndpointUrl: customUrlSchema("RPC_URL_{chainId}"),
  rpcMaxRequestsPerSecond: z
    .number({ error: "RPC max requests per second must be a number." })
    .int({ error: "RPC max requests per second must be an integer." })
    .min(1, { error: "RPC max requests per second must be at least 1." })
    .default(DEFAULT_RPC_RATE_LIMIT),
});

const ENSDeploymentChainSchema = z
  .enum(Object.keys(ENSDeployments) as [keyof typeof ENSDeployments], {
    error: (issue) => {
      return `Invalid ENS_DEPLOYMENT_CHAIN. Supported chains are: ${Object.keys(
        ENSDeployments
      ).join(", ")}`;
    },
  })
  .default("mainnet");

export const ENSIndexerConfigSchema = z.object({
  ensDeploymentChain: ENSDeploymentChainSchema,
  globalBlockrange: z
    .object({
      startBlock: z.preprocess(
        (v) => (v === undefined || v === "" ? undefined : Number(v)),
        z
          .number({ error: "START_BLOCK must be a number." })
          .int({ error: "START_BLOCK must be an integer." })
          .min(0, { error: "START_BLOCK must be a non-negative number." })
          .optional()
      ),
      endBlock: z.preprocess(
        (v) => (v === undefined || v === "" ? undefined : Number(v)),
        z
          .number({ error: "END_BLOCK must be a number." })
          .int({ error: "END_BLOCK must be an integer." })
          .min(0, { error: "END_BLOCK must be a non-negative number." })
          .optional()
      ),
    })
    .refine(
      (val) =>
        val.startBlock === undefined ||
        val.endBlock === undefined ||
        val.startBlock <= val.endBlock,
      { error: "END_BLOCK must be greater than or equal to START_BLOCK." }
    ),
  ensNodePublicUrl: customUrlSchema("ENSNODE_PUBLIC_URL"),
  ensAdminUrl: customUrlSchema("ENSADMIN_URL").default(DEFAULT_ENSADMIN_URL),
  ponderDatabaseSchema: z
    .string({
      error: (issue) => {
        if (issue.input === undefined) return "DATABASE_SCHEMA is required.";
        if (String(issue.input).trim() === "")
          return "DATABASE_SCHEMA cannot be empty.";
        return "DATABASE_SCHEMA must be a string.";
      },
    })
    .default(DEFAULT_DATABASE_SCHEMA),
  requestedPluginNames: z.preprocess(
    (val) => {
      if (val === undefined) {
        return []; // Convert undefined to an empty array
      }
      if (typeof val === "string") {
        return val
          .split(",")
          .map((name) => name.trim())
          .filter((name) => name.length > 0);
      }
      return val;
    },
    z
      .array(
        z.string({
          error: "Each plugin name in ACTIVE_PLUGINS must be a string.",
        }),
        { error: "ACTIVE_PLUGINS must resolve to a list of plugin names." }
      )
      .min(1, {
        error:
          "ACTIVE_PLUGINS must be set and contain at least one valid plugin name (e.g. 'subgraph' or 'subgraph,basenames').",
      })
  ),
  healReverseAddresses: z.preprocess(
    (val) => {
      if (val === undefined || (typeof val === "string" && val.trim() === ""))
        return DEFAULT_HEAL_REVERSE_ADDRESSES;
      if (val === "true") return true;
      if (val === "false") return false;
      return val;
    },
    z.boolean({
      error: "HEAL_REVERSE_ADDRESSES must be 'true' or 'false'.", // Zod 4: direct error message for type
    })
  ),
  ponderPort: z.preprocess(
    (val) => (val === undefined || val === "" ? DEFAULT_PORT : Number(val)),
    z
      .number({ error: "Ponder port (PORT env var) must be a number." })
      .int({ error: "Ponder port (PORT env var) must be an integer." })
      .max(65535, {
        error:
          "Ponder port (PORT env var) must be a number between 1 and 65535.",
      })
      .min(1, {
        error:
          "Ponder port (PORT env var) must be a number between 1 and 65535.",
      })
  ),
  ensRainbowEndpointUrl: customUrlSchema("ENSRAINBOW_URL").default(
    DEFAULT_ENSRAINBOW_URL
  ),
  chains: z
    .record(
      z
        .string({
          error: (issue) => {
            if (issue.input === undefined)
              return "Chain ID key in RPC_URL_{chainId} is required.";
            if (!/^\d+$/.test(String(issue.input)))
              return "Chain ID in RPC_URL_{chainId} must be a string of digits.";
            return "Invalid Chain ID key format for RPC_URL_{chainId}.";
          },
        })
        .transform(Number),
      ChainConfigSchema,
      {
        error:
          "Chains configuration must be an object mapping numeric chain IDs to their configs.",
      }
    )
    .optional()
    .default({}),
});
