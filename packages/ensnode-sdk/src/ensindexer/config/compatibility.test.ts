import { describe, expect, it } from "vitest";

import { ENSNamespaceIds } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

import {
  type ENSIndexerPublicConfigCompatibilityCheck,
  validateENSIndexerPublicConfigCompatibility,
} from "./compatibility";

describe("ENSIndexerConfig compatibility", () => {
  describe("validateENSIndexerPublicConfigCompatibility()", () => {
    const config = {
      indexedChainIds: new Set([1, 10, 8453]),
      isSubgraphCompatible: false,
      namespace: ENSNamespaceIds.Mainnet,
      plugins: [PluginName.Subgraph, PluginName.Basenames, PluginName.ThreeDNS],
    } satisfies ENSIndexerPublicConfigCompatibilityCheck;

    it("does not throw error when 'configB' is compatible with 'configA' ('configA' is subset of 'configB')", () => {
      const configA = structuredClone(config);

      const configB = structuredClone(config);
      configB.indexedChainIds.add(59144);
      configB.plugins.push(PluginName.Lineanames);

      expect(() =>
        validateENSIndexerPublicConfigCompatibility(configA, configB),
      ).not.toThrowError();
    });

    it("throws error when 'configA.indexedChainIds' are not subset of 'configB.indexedChainIds'", () => {
      const configA = structuredClone(config);

      const configB = structuredClone(config);
      configB.indexedChainIds.delete(8453);

      expect(() => validateENSIndexerPublicConfigCompatibility(configA, configB)).toThrowError(
        /'indexedChainIds' must be compatible. Stored Config 'indexedChainIds': '1, 10, 8453'. Current Config 'indexedChainIds': '1, 10'/i,
      );
    });

    it("throws error when 'configA.isSubgraphCompatible' is not same as 'configB.isSubgraphCompatible'", () => {
      const configA = structuredClone(config);

      const configB = {
        ...structuredClone(config),
        isSubgraphCompatible: !configA.isSubgraphCompatible,
      } satisfies ENSIndexerPublicConfigCompatibilityCheck;

      expect(() => validateENSIndexerPublicConfigCompatibility(configA, configB)).toThrowError(
        /'isSubgraphCompatible' flag must be compatible. Stored Config 'isSubgraphCompatible' flag: 'false'. Current Config 'isSubgraphCompatible' flag: 'true'/i,
      );
    });

    it("throws error when 'configA.isSubgraphCompatible' is not same as 'configB.isSubgraphCompatible'", () => {
      const configA = structuredClone(config);

      const configB = {
        ...structuredClone(config),
        namespace: ENSNamespaceIds.Sepolia,
      } satisfies ENSIndexerPublicConfigCompatibilityCheck;

      expect(() => validateENSIndexerPublicConfigCompatibility(configA, configB)).toThrowError(
        /'namespace' must be compatible. Stored Config 'namespace': 'mainnet'. Current Config 'namespace': 'sepolia'/i,
      );
    });

    it("throws error when 'configA.plugins' are not subset of 'configB.plugins'", () => {
      const configA = structuredClone(config);

      const configB = structuredClone(config);
      configB.plugins.pop();

      expect(() => validateENSIndexerPublicConfigCompatibility(configA, configB)).toThrowError(
        /'plugins' must be compatible. Stored Config 'plugins': 'subgraph, basenames, threedns'. Current Config 'plugins': 'subgraph, basenames'/i,
      );
    });
  });
});
