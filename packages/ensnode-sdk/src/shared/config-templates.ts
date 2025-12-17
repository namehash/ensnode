import { ENSNamespaceIds } from "@ensnode/datasources";

/**
 * Represents the well-known ENSNode configuration templates deployed to the cloud. The value of each
 * key matches the domain segment that identifies this configuration template.
 */
export const ConfigTemplateIds = {
  Mainnet: "mainnet",
  Sepolia: "sepolia",
  Holesky: "holesky",
  Alpha: "alpha",
  AlphaSepolia: "alpha-sepolia",
};

export type ConfigTemplateId = (typeof ConfigTemplateIds)[keyof typeof ConfigTemplateIds];

/**
 * Determines whether the provided `configTemplateId` is Subgraph Compatible.
 */
export function isConfigTemplateSubgraphCompatible(configTemplateId: ConfigTemplateId) {
  switch (configTemplateId) {
    case ConfigTemplateIds.Mainnet:
    case ConfigTemplateIds.Sepolia:
    case ConfigTemplateIds.Holesky:
      return true;

    case ConfigTemplateIds.Alpha:
    case ConfigTemplateIds.AlphaSepolia:
      return false;
    default:
      throw new Error("never");
  }
}

/**
 * Determines the ENSNamespaceId for the provided `configTemplateId`.
 */
export function namespaceForConfigTemplateId(configTemplateId: ConfigTemplateId) {
  switch (configTemplateId) {
    case ConfigTemplateIds.Alpha:
    case ConfigTemplateIds.Mainnet:
      return ENSNamespaceIds.Mainnet;
    case ConfigTemplateIds.AlphaSepolia:
    case ConfigTemplateIds.Sepolia:
      return ENSNamespaceIds.Sepolia;
    case ConfigTemplateIds.Holesky:
      return ENSNamespaceIds.Holesky;
    default:
      throw new Error("never");
  }
}
