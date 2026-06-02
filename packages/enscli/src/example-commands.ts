/**
 * Single source of truth for the example commands shown in the `enscli` agent skill.
 *
 * Rendered into `packages/ensskills/skills/enscli/SKILL.md` by the ensskills `generate` script
 * (each {@link EnscliExampleGroup} maps to an `AUTOGEN` region), and executed against the
 * integration test env by `cli.integration.test.ts` so the skill only ever ships commands that run.
 *
 * Keep this file dependency-free (plain data): the generator imports it directly via `tsx`.
 */

/** SKILL.md `AUTOGEN` region an example renders into. */
export type EnscliExampleGroup =
  | "omnigraph"
  | "omnigraph-schema"
  | "indexing-status"
  | "ensrainbow"
  | "datasources"
  | "hash";

/**
 * Backend a command needs to execute: `none` runs offline (hashing / bundled-schema introspection),
 * `ensnode` needs an ENSNode instance, `ensrainbow` needs an ENSRainbow instance. The integration
 * test supplies the matching devnet URL, overriding any namespace baked into {@link EnscliExample.args}.
 */
export type EnscliExampleBackend = "none" | "ensnode" | "ensrainbow";

export interface EnscliExample {
  /** Stable identifier; also the integration test case name. */
  id: string;
  /** Comment rendered above the command in the SKILL.md code block. */
  comment: string;
  /** argv passed to `enscli` (everything after the binary name). */
  args: string[];
  group: EnscliExampleGroup;
  backend: EnscliExampleBackend;
}

export const ENSCLI_EXAMPLE_COMMANDS: EnscliExample[] = [
  {
    id: "omnigraph-inline-query",
    comment: "Inline query (default namespace: mainnet)",
    args: ["ensnode", "omnigraph", `{ domain(by: { name: "vitalik.eth" }) { owner { address } } }`],
    group: "omnigraph",
    backend: "ensnode",
  },
  {
    id: "omnigraph-query-with-variables",
    comment: "With variables",
    args: [
      "ensnode",
      "omnigraph",
      `query D($n: InterpretedName!) {
  domain(by: { name: $n }) {
    canonical { name { interpreted } }
    resolve { records { addresses(coinTypes: [60]) { address } } }
  }
}`,
      "--variables",
      `{"n":"vitalik.eth"}`,
    ],
    group: "omnigraph",
    backend: "ensnode",
  },
  {
    id: "schema-overview",
    comment: "root query fields + the major types",
    args: ["ensnode", "omnigraph", "schema"],
    group: "omnigraph-schema",
    backend: "none",
  },
  {
    id: "schema-type",
    comment: "a type's fields, with descriptions",
    args: ["ensnode", "omnigraph", "schema", "Domain"],
    group: "omnigraph-schema",
    backend: "none",
  },
  {
    id: "schema-field",
    comment: "a single field",
    args: ["ensnode", "omnigraph", "schema", "Domain.canonical"],
    group: "omnigraph-schema",
    backend: "none",
  },
  {
    id: "schema-search",
    comment: "find types/fields by keyword",
    args: ["ensnode", "omnigraph", "schema", "--search", "primary"],
    group: "omnigraph-schema",
    backend: "none",
  },
  {
    id: "indexing-status-default",
    comment: "Default namespace (mainnet)",
    args: ["ensnode", "indexing-status"],
    group: "indexing-status",
    backend: "ensnode",
  },
  {
    id: "indexing-status-namespace",
    comment: "A specific namespace",
    args: ["ensnode", "indexing-status", "--namespace", "sepolia-v2"],
    group: "indexing-status",
    backend: "ensnode",
  },
  {
    id: "ensrainbow-heal",
    comment: "Heal a labelHash to its original label",
    args: [
      "ensrainbow",
      "heal",
      "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
    ],
    group: "ensrainbow",
    backend: "ensrainbow",
  },
  {
    id: "ensrainbow-count",
    comment: "Count the labels ENSRainbow can heal",
    args: ["ensrainbow", "count"],
    group: "ensrainbow",
    backend: "ensrainbow",
  },
  {
    id: "datasources-identify",
    comment: "Identify a well-known contract by address (default namespace: mainnet, offline)",
    args: ["datasources", "identify", "0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e"],
    group: "datasources",
    backend: "none",
  },
  {
    id: "datasources-identify-chain-scoped",
    comment: "Scope to a chain with chainId:address (eip155:1:0x… also accepted)",
    args: ["datasources", "identify", "1:0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85"],
    group: "datasources",
    backend: "none",
  },
  {
    id: "datasources-identify-namespace",
    comment: "Search a different namespace",
    args: [
      "datasources",
      "identify",
      "0x94f523b8261b815b87effcf4d18e6abef18d6e4b",
      "--namespace",
      "sepolia",
    ],
    group: "datasources",
    backend: "none",
  },
  {
    id: "namehash",
    comment: "Compute the Node of a Name (offline)",
    args: ["namehash", "vitalik.eth"],
    group: "hash",
    backend: "none",
  },
  {
    id: "labelhash",
    comment: "Compute the LabelHash of a Label (offline)",
    args: ["labelhash", "vitalik"],
    group: "hash",
    backend: "none",
  },
];
