import type { ENSIndexerPublicConfig } from "./types";

export type ENSIndexerPublicConfigCompatibilityCheck = Pick<
  ENSIndexerPublicConfig,
  "indexedChainIds" | "isSubgraphCompatible" | "namespace" | "plugins"
>;

/**
 * Validate if `configB` is compatible with `configA`, such that `configA` is
 * a subset of `configB`.
 *
 * @throws error if configs are incompatible.
 */
export function validateENSIndexerPublicConfigCompatibility(
  configA: ENSIndexerPublicConfigCompatibilityCheck,
  configB: ENSIndexerPublicConfigCompatibilityCheck,
): void {
  const configAIndexedChainIds = Array.from(configA.indexedChainIds);
  const configBIndexedChainIds = Array.from(configB.indexedChainIds);
  if (
    !configAIndexedChainIds.every((configAChainId) =>
      configBIndexedChainIds.includes(configAChainId),
    )
  ) {
    throw new Error(
      [
        `'indexedChainIds' must be compatible.`,
        `Stored Config 'indexedChainIds': '${configAIndexedChainIds.join(", ")}'.`,
        `Current Config 'indexedChainIds': '${configBIndexedChainIds.join(", ")}'.`,
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
