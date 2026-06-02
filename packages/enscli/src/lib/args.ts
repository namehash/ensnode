import type { ArgsDef } from "citty";

/** Args for selecting which ENS namespace a command operates on. */
export const namespaceArgs = {
  namespace: {
    type: "string",
    alias: "n",
    description: "ENS namespace: mainnet, sepolia, sepolia-v2, or ens-test-env (default: mainnet)",
  },
} satisfies ArgsDef;

/**
 * Args for selecting which ENSNode instance a command talks to.
 *
 * Resolution precedence (see {@link ./config}): CLI flag > process env > `.env` > namespace default.
 */
export const ensnodeArgs = {
  ...namespaceArgs,
  "ensnode-url": {
    type: "string",
    description: "ENSNode instance URL (overrides the namespace default; or set ENSNODE_URL)",
  },
} satisfies ArgsDef;

/**
 * Args for selecting which ENSRainbow instance a command talks to.
 *
 * Resolution precedence (see {@link ./config}): CLI flag > process env > `.env` > default.
 */
export const ensRainbowArgs = {
  "ensrainbow-url": {
    type: "string",
    description: "ENSRainbow instance URL (or set ENSRAINBOW_URL)",
  },
} satisfies ArgsDef;

/** Args controlling output format, shared by every command. */
export const outputArgs = {
  output: {
    type: "string",
    alias: "o",
    description: 'Output format: "json" or "pretty" (default: json when piped, pretty in a TTY)',
  },
} satisfies ArgsDef;
