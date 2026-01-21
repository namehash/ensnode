import { ENSNamespaceIds } from "@ensnode/datasources";

/**
 * Represents the well-known ENSNode configuration templates deployed to the cloud. The value of each
 * key matches the domain segment that identifies this configuration template.
 *
 * @see https://ensnode.io/docs/usage/hosted-ensnode-instances/
 */
export const ConfigTemplateIds = {
  Mainnet: "mainnet",
  Sepolia: "sepolia",
  Alpha: "alpha",
  AlphaSepolia: "alpha-sepolia",
};

export type ConfigTemplateId = (typeof ConfigTemplateIds)[keyof typeof ConfigTemplateIds];

/**
 * Determines whether the provided `configTemplateId` is Subgraph Compatible.
 *
 * See packages/ensnode-sdk/src/ensindexer/config/is-subgraph-compatible.ts for additional info.
 *
 * @see https://ensnode.io/docs/concepts/what-is-the-ens-subgraph/
 */
export function isConfigTemplateSubgraphCompatible(configTemplateId: ConfigTemplateId) {
  switch (configTemplateId) {
    // these ConfigTemplates are run with SUBGRAPH_COMPAT, meaning they are Subgraph Compatible
    case ConfigTemplateIds.Mainnet:
    case ConfigTemplateIds.Sepolia:
      return true;

    // these instances are NOT run with SUBGRAPH_COMPAT, meaning they are NOT Subgraph Compatible
    case ConfigTemplateIds.Alpha:
    case ConfigTemplateIds.AlphaSepolia:
      return false;
    default:
      throw new Error("never");
  }
}

/**
 * Determines the ENSNamespaceId for the provided `configTemplateId`.
 *
 * @see https://ensnode.io/docs/usage/hosted-ensnode-instances/
 */
export function namespaceForConfigTemplateId(configTemplateId: ConfigTemplateId) {
  switch (configTemplateId) {
    case ConfigTemplateIds.Alpha:
    case ConfigTemplateIds.Mainnet:
      return ENSNamespaceIds.Mainnet;
    case ConfigTemplateIds.AlphaSepolia:
    case ConfigTemplateIds.Sepolia:
      return ENSNamespaceIds.Sepolia;
    default:
      throw new Error("never");
  }
}
