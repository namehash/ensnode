import { ENSNamespaceIds } from "@ensnode/ensnode-sdk";

/** ENS namespaces used as Omnigraph example targets in docs. */
export type DocsOmnigraphExampleNamespace =
  | typeof ENSNamespaceIds.Mainnet
  | typeof ENSNamespaceIds.SepoliaV2;

export type DocsOmnigraphNamespaceConfig = {
  hostedInstanceAnchor: string;
  hostedInstanceLabel: string;
  ensnodeUrl: string;
};

/** Per-namespace hosted instance metadata for example snapshots and output copy. */
export const DOCS_OMNIGRAPH_NAMESPACE_CONFIG: Record<
  DocsOmnigraphExampleNamespace,
  DocsOmnigraphNamespaceConfig
> = {
  [ENSNamespaceIds.Mainnet]: {
    hostedInstanceAnchor: "ensnode-alpha",
    hostedInstanceLabel: "alpha",
    ensnodeUrl: "https://api.alpha.ensnode.io",
  },
  [ENSNamespaceIds.SepoliaV2]: {
    hostedInstanceAnchor: "ensnode-v2-sepolia",
    hostedInstanceLabel: "sepolia-v2",
    ensnodeUrl: "https://api.v2-sepolia.ensnode.io",
  },
};

export function getDocsOmnigraphNamespaceConfig(
  namespace: DocsOmnigraphExampleNamespace,
): DocsOmnigraphNamespaceConfig {
  const config = DOCS_OMNIGRAPH_NAMESPACE_CONFIG[namespace];
  if (!config) {
    throw new Error(`Unknown docs Omnigraph example namespace: ${namespace}`);
  }
  return config;
}

// Used for interactive playgrounds
export const DEFAULT_ENSNODE_URL = getDocsOmnigraphNamespaceConfig(
  ENSNamespaceIds.Mainnet,
).ensnodeUrl;
