import { ENSDeployments } from "@ensnode/ens-deployments";
import * as z from "zod";

export const DEFAULT_RPC_RATE_LIMIT = 50;
export const DEFAULT_ENSADMIN_URL = "https://admin.ensnode.io";
export const DEFAULT_DATABASE_SCHEMA = "ensnode";
export const DEFAULT_PORT = 42069;
export const DEFAULT_HEAL_REVERSE_ADDRESSES = true;
export const DEFAULT_DEPLOYMENT = "mainnet";

const customUrlSchema = (envVarKey: string) => {
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
        }
      )
  );
};

const ChainConfigSchema = z.object({
  rpcEndpointUrl: customUrlSchema("RPC_URL"),
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
  .default(DEFAULT_DEPLOYMENT);

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
      // handle empty strings as default instead of throwing an error
      if (val === undefined || (typeof val === "string" && val.trim() === ""))
        return DEFAULT_HEAL_REVERSE_ADDRESSES;
      if (val === "true") return true;
      if (val === "false") return false;
      return val;
    },
    z.boolean({
      error: "HEAL_REVERSE_ADDRESSES must be 'true' or 'false'.",
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
  ensRainbowEndpointUrl: customUrlSchema("ENSRAINBOW_URL"),
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
