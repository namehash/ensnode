import type { EnsIndexerPublicConfig } from "./types";

export type EnsIndexerPublicConfigCompatibilityCheck = Omit<
  EnsIndexerPublicConfig,
  "ensIndexerSchemaName" | "ensRainbowPublicConfig" | "versionInfo"
>;

/**
 * Validate if `configB` is compatible with `configA`, such that `configA` equals to `configB`.
 *
 * @throws error if configs are incompatible.
 */
export function validateEnsIndexerPublicConfigCompatibility(
  configA: EnsIndexerPublicConfigCompatibilityCheck,
  configB: EnsIndexerPublicConfigCompatibilityCheck,
): void {
  if (configA.indexedChainIds.symmetricDifference(configB.indexedChainIds).size > 0) {
    throw new Error(
      [
        `'indexedChainIds' must be compatible.`,
        `Stored Config 'indexedChainIds': '${Array.from(configA.indexedChainIds).join(", ")}'.`,
        `Current Config 'indexedChainIds': '${Array.from(configB.indexedChainIds).join(", ")}'.`,
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

  if (configA.clientLabelSet.labelSetId !== configB.clientLabelSet.labelSetId) {
    throw new Error(
      [
        `'clientLabelSet.labelSetId' must be compatible.`,
        `Stored Config 'clientLabelSet.labelSetId': '${configA.clientLabelSet.labelSetId}'.`,
        `Current Config 'clientLabelSet.labelSetId': '${configB.clientLabelSet.labelSetId}'.`,
      ].join(" "),
    );
  }

  if (configA.clientLabelSet.labelSetVersion !== configB.clientLabelSet.labelSetVersion) {
    throw new Error(
      [
        `'clientLabelSet.labelSetVersion' must be compatible.`,
        `Stored Config 'clientLabelSet.labelSetVersion': '${configA.clientLabelSet.labelSetVersion}'.`,
        `Current Config 'clientLabelSet.labelSetVersion': '${configB.clientLabelSet.labelSetVersion}'.`,
      ].join(" "),
    );
  }

  const configAPluginsSet = new Set(configA.plugins);
  const configBPluginsSet = new Set(configB.plugins);

  if (configAPluginsSet.symmetricDifference(configBPluginsSet).size > 0) {
    throw new Error(
      [
        `'plugins' must be compatible.`,
        `Stored Config 'plugins': '${configA.plugins.join(", ")}'.`,
        `Current Config 'plugins': '${configB.plugins.join(", ")}'.`,
      ].join(" "),
    );
  }
}
