import type { SerializedENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";

export type ENSIndexerPublicConfigCompatibilityCheck = Pick<
  SerializedENSIndexerPublicConfig,
  "indexedChainIds" | "isSubgraphCompatible" | "namespace" | "plugins"
>;

/**
 * Validate if `configB` is compatible with `configA`, such that `configA` is
 * a subset of `configB`.
 *
 * @throws error if 'indexedChainIds' were incompatible.
 * @throws error if 'isSubgraphCompatible' flag was incompatible.
 * @throws error if 'namespace' was incompatible.
 * @throws error if 'plugins' were incompatible.
 */
export function validateENSIndexerPublicConfigCompatibility(
  configA: ENSIndexerPublicConfigCompatibilityCheck,
  configB: ENSIndexerPublicConfigCompatibilityCheck,
): void {
  if (
    !configA.indexedChainIds.every((configAChainId) =>
      configB.indexedChainIds.includes(configAChainId),
    )
  ) {
    throw new Error(
      [
        `'indexedChainIds' must be compatible.`,
        `Stored Config 'indexedChainIds': '${configA.indexedChainIds.join(", ")}'.`,
        `Current Config 'indexedChainIds': '${configB.indexedChainIds.join(", ")}'.`,
      ].join(" "),
    );
  }

  if (configA.isSubgraphCompatible !== configB.isSubgraphCompatible) {
    throw new Error(
      [
        `'isSubgraphCompatible' flag must be compatible.`,
        `Stored Config 'isSubgraphCompatible' flag: '${configA.isSubgraphCompatible}'.`,
        `Current Config 'isSubgraphCompatible' flag: '${configB.isSubgraphCompatible}'.`,
      ].join(" "),
    );
  }

  if (configA.namespace !== configB.namespace) {
    throw new Error(
      [
        `'namespace' must be compatible.`,
        `Stored Config 'namespace': '${configA.namespace}'.`,
        `Current Config 'namespace': '${configB.namespace}'.`,
      ].join(" "),
    );
  }

  if (!configA.plugins.every((configAPlugin) => configB.plugins.includes(configAPlugin))) {
    throw new Error(
      [
        `'plugins' must be compatible.`,
        `Stored Config 'plugins': '${configA.plugins.join(", ")}'.`,
        `Current Config 'plugins': '${configB.plugins.join(", ")}'.`,
      ].join(" "),
    );
  }
}
