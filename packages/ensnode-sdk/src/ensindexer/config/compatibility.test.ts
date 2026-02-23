import { describe, expect, it } from "vitest";

import { ENSNamespaceIds } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

import {
  type EnsIndexerPublicConfigCompatibilityCheck,
  validateEnsIndexerPublicConfigCompatibility,
} from "./compatibility";

describe("EnsIndexerConfig compatibility", () => {
  describe("validateEnsIndexerPublicConfigCompatibility()", () => {
    const config = {
      indexedChainIds: new Set([1, 10, 8453]),
      labelSet: {
        labelSetId: "test-label-set",
        labelSetVersion: 1,
      },
      isSubgraphCompatible: false,
      namespace: ENSNamespaceIds.Mainnet,
      plugins: [PluginName.Subgraph, PluginName.Basenames, PluginName.ThreeDNS],
    } satisfies EnsIndexerPublicConfigCompatibilityCheck;

    it("does not throw error when 'configA' and 'configB' are equal", () => {
      const configA = structuredClone(config);
      const configB = structuredClone(config);

      expect(() =>
        validateEnsIndexerPublicConfigCompatibility(configA, configB),
      ).not.toThrowError();
    });

    it("throws error when 'configA.indexedChainIds' differ from 'configB.indexedChainIds'", () => {
      const configA = structuredClone(config);

      const configB = structuredClone(config);
      configB.indexedChainIds.delete(8453);

      expect(() => validateEnsIndexerPublicConfigCompatibility(configA, configB)).toThrowError(
        /'indexedChainIds' must be compatible. Stored Config 'indexedChainIds': '1, 10, 8453'. Current Config 'indexedChainIds': '1, 10'/i,
      );
    });

    it("throws error when 'configA.isSubgraphCompatible' is not same as 'configB.isSubgraphCompatible'", () => {
      const configA = structuredClone(config);

      const configB = {
        ...structuredClone(config),
        isSubgraphCompatible: !configA.isSubgraphCompatible,
      } satisfies EnsIndexerPublicConfigCompatibilityCheck;

      expect(() => validateEnsIndexerPublicConfigCompatibility(configA, configB)).toThrowError(
        /'isSubgraphCompatible' flag must be compatible. Stored Config 'isSubgraphCompatible' flag: 'false'. Current Config 'isSubgraphCompatible' flag: 'true'/i,
      );
    });

    it("throws error when 'configA.namespace' is not same as 'configB.namespace'", () => {
      const configA = structuredClone(config);

      const configB = {
        ...structuredClone(config),
        namespace: ENSNamespaceIds.Sepolia,
      } satisfies EnsIndexerPublicConfigCompatibilityCheck;

      expect(() => validateEnsIndexerPublicConfigCompatibility(configA, configB)).toThrowError(
        /'namespace' must be compatible. Stored Config 'namespace': 'mainnet'. Current Config 'namespace': 'sepolia'/i,
      );
    });

    it("throws error when 'configA.labelSet.labelSetId' is not same as 'configB.labelSet.labelSetId'", () => {
      const configA = structuredClone(config);

      const configB = {
        ...structuredClone(config),
        labelSet: {
          ...structuredClone(config.labelSet),
          labelSetId: "different-label-set",
        },
      } satisfies EnsIndexerPublicConfigCompatibilityCheck;

      expect(() => validateEnsIndexerPublicConfigCompatibility(configA, configB)).toThrowError(
        /'labelSet.labelSetId' must be compatible. Stored Config 'labelSet.labelSetId': 'test-label-set'. Current Config 'labelSet.labelSetId': 'different-label-set'/i,
      );
    });

    it("throws error when 'configA.labelSet.labelSetVersion' is not same as 'configB.labelSet.labelSetVersion'", () => {
      const configA = structuredClone(config);

      const configB = {
        ...structuredClone(config),
        labelSet: {
          ...structuredClone(config.labelSet),
          labelSetVersion: config.labelSet.labelSetVersion + 1,
        },
      } satisfies EnsIndexerPublicConfigCompatibilityCheck;

      expect(() => validateEnsIndexerPublicConfigCompatibility(configA, configB)).toThrowError(
        /'labelSet.labelSetVersion' must be compatible. Stored Config 'labelSet.labelSetVersion': '1'. Current Config 'labelSet.labelSetVersion': '2'/i,
      );
    });

    it("throws error when 'configA.plugins' differ from 'configB.plugins'", () => {
      const configA = structuredClone(config);

      const configB = structuredClone(config);
      configB.plugins.pop();

      expect(() => validateEnsIndexerPublicConfigCompatibility(configA, configB)).toThrowError(
        /'plugins' must be compatible. Stored Config 'plugins': 'subgraph, basenames, threedns'. Current Config 'plugins': 'subgraph, basenames'/i,
      );
    });
  });
});
