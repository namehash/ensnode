import { ENSDeployments } from "@ensnode/ens-deployments";
import * as z from "zod";

export const DEFAULT_RPC_RATE_LIMIT = 50;
export const DEFAULT_ENSADMIN_URL = "https://admin.ensnode.io";
export const DEFAULT_PORT = 42069;
export const DEFAULT_HEAL_REVERSE_ADDRESSES = true;
export const DEFAULT_DEPLOYMENT = "mainnet";

// This validates URLs but also accepts localhost URLs. The zod equivalent of this is .url()
// but it doesn't accept localhost URLs.
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
        }
      )
  );
};

/**
 * Configuration for a single blockchain network (chain) used by ENSIndexer.
 */
const ChainConfigSchema = z.object({
  /**
   * The RPC endpoint URL for the chain.
   * Example: "https://eth-mainnet.g.alchemy.com/v2/..."
   * This must be an endpoint with high rate limits
   *
   * Invariants:
   * - The URL must be a valid URL (localhost urls are allowed)
   */
  rpcEndpointUrl: url("RPC_URL"),

  /**
   * The maximum number of RPC requests per second allowed for this chain.
   * This is used to avoid rate limiting by the RPC provider. This value
   * is optional and defaults to DEFAULT_RPC_RATE_LIMIT if not specified.
   */
  rpcMaxRequestsPerSecond: z.coerce
    .number({ error: "RPC max requests per second must be a number." })
    .int({ error: "RPC max requests per second must be an integer." })
    .min(1, { error: "RPC max requests per second must be at least 1." })
    .default(DEFAULT_RPC_RATE_LIMIT),
});

// Schema for a variable for a block number
const BlockNumberSchema = (envVarKey: string) =>
  z.coerce
    .number({ error: `${envVarKey} must be a number.` })
    .int({ error: `${envVarKey} must be an integer.` })
    .min(0, { error: `${envVarKey} must be a non-negative number.` })
    .optional();

/**
 * The complete runtime configuration for an ENSIndexer application instance.
 */
export const ENSIndexerConfigSchema = z.object({
  /**
   * The ENS Deployment for the indexer which could be "mainnet", "sepolia", etc.
   *
   * (see `@ensnode/ens-deployments` for available deployments)
   */
  ensDeploymentChain: z
    .enum(Object.keys(ENSDeployments) as [keyof typeof ENSDeployments], {
      error: (issue) => {
        return `Invalid ENS_DEPLOYMENT_CHAIN. Supported chains are: ${Object.keys(
          ENSDeployments
        ).join(", ")}`;
      },
    })
    .default(DEFAULT_DEPLOYMENT),

  /**
   * The global block range to index (start and end block numbers).
   */
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
      { error: "END_BLOCK must be greater than or equal to START_BLOCK." }
    ),

  /**
   * The ENSIndexer public service URL
   *
   * When the root route `/` of ENSIndexer receives a request, ENSIndexer redirects to the
   * configured ENSADMIN_URL with an instruction for that ENSAdmin instance to connect back to this
   * provided URL for querying state about the ENSNode instance.
   *
   * Invariants:
   * - The URL must be a valid URL (localhost urls are allowed)
   */
  ensNodePublicUrl: url("ENSNODE_PUBLIC_URL"),

  /**
   * The ENSAdmin service URL.
   *
   * When the root route `/` of ENSIndexer receives a request, ENSIndexer redirects to this
   * provided ENSAdmin URL with an instruction for that ENSAdmin instance to connect back to the
   * configured ENSNODE_PUBLIC_URL.
   *
   * If this is not set, DEFAULT_ENSADMIN_URL will be used to provide easy access to an ENSAdmin UI.
   *
   * Invariants:
   * - The URL must be a valid URL (localhost urls are allowed)
   */
  ensAdminUrl: url("ENSADMIN_URL").default(DEFAULT_ENSADMIN_URL),

  /*
   * This is a namespace for the tables that the indexer will create to store indexed data.
   * It should be a string that is unique to the running indexer instance.
   *
   * Keeping the database schema unique to the indexer instance is important to
   * 1) speed up indexing after a restart
   * 2) prevent data corruption from multiple indexer app instances writing state
   *    concurrently to the same db schema
   *
   * No two indexer instances can use the same database schema at the same time.
   *
   * Read more about database schema rules here:
   * https://ponder.sh/docs/api-reference/database#database-schema-rules
   */
  ponderDatabaseSchema: z.string({
    error: (issue) => {
      if (issue.input === undefined) return "DATABASE_SCHEMA is required.";
      if (String(issue.input).trim() === "")
        return "DATABASE_SCHEMA cannot be empty.";
      return "DATABASE_SCHEMA must be a string.";
    },
  }),

  /**
   * Identify which indexer plugins to activate (see `src/plugins` for available plugins)
   * This is a comma separated list of one or more available plugin names (case-sensitive).
   */
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

  /**
   * A feature flag to enable or disable healing of addr.reverse subnames.
   * If this is set to true, ENSIndexer will attempt to heal subnames of
   * addr.reverse.
   *
   * If this is not set, the default value is set to `DEFAULT_HEAL_REVERSE_ADDRESSES`.
   *
   * Setting this to `true` results in indexed data no longer being backwards
   * compatible with the ENS Subgraph. For full data-level backwards
   * compatibility with the ENS Subgraph, this should be set to `false`.
   */
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

  /**
   * The network port ENSIndexer listens for http requests on. ENSIndexer
   * exposes various APIs, most notably the GRAPHQL API. All APIs are accessable
   * on the same port. This defaults to DEFAULT_PORT if not specified.
   */
  port: z.coerce
    .number({ error: "PORT must be a number." })
    .int({ error: "PORT must be an integer." })
    .max(65535, {
      error: "PORT must be a number between 1 and 65535.",
    })
    .min(1, {
      error: "PORT must be a number between 1 and 65535.",
    })
    .default(DEFAULT_PORT),

  /**
   * The endpoint URL for the ENSRainbow API. ENSIndexer uses this for fetching
   * data about labelhashes (healing) when indexing. This should be set to a
   * colocated instance of ENSRainbow for best performance.
   */
  ensRainbowEndpointUrl: url("ENSRAINBOW_URL"),

  /**
   * Configuration for each indexed chain, keyed by chain ID.
   */
  indexedChains: z
    .record(z.string().transform(Number), ChainConfigSchema, {
      error:
        "Chains configuration must be an object mapping numeric chain IDs to their configs.",
    })
    .optional()
    .default({}),
});

export type ENSIndexerConfig = z.infer<typeof ENSIndexerConfigSchema>;
export type ChainConfig = z.infer<typeof ChainConfigSchema>;
