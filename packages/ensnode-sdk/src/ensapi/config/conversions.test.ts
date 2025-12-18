import { describe, expect, it } from "vitest";

import { ENSNamespaceIds } from "@ensnode/datasources";

import { PluginName } from "../../ensindexer/config/types";
import { deserializeENSApiPublicConfig } from "./deserialize";
import { serializeENSApiPublicConfig } from "./serialize";
import type { ENSApiPublicConfig } from "./types";

const MOCK_ENSAPI_PUBLIC_CONFIG = {
  version: "0.36.0",
  theGraphFallback: {
    canFallback: false,
    reason: "no-api-key",
  },
  ensIndexerPublicConfig: {
    namespace: ENSNamespaceIds.Mainnet,
    databaseSchemaName: "ensapi",
    indexedChainIds: new Set([1]),
    isSubgraphCompatible: false,
    labelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
    plugins: [PluginName.Subgraph],
    versionInfo: {
      ensDb: "0.36.0",
      ensIndexer: "0.36.0",
      ensRainbow: "0.36.0",
      ensRainbowSchema: 1,
      ensNormalize: "1.1.1",
      nodejs: "20.0.0",
      ponder: "0.5.0",
    },
  },
} satisfies ENSApiPublicConfig;

const MOCK_SERIALIZED_ENSAPI_PUBLIC_CONFIG = serializeENSApiPublicConfig(MOCK_ENSAPI_PUBLIC_CONFIG);

describe("ENSApi Config Serialization/Deserialization", () => {
  describe("serializeENSApiPublicConfig", () => {
    it("serializes ENSAPI public config correctly", () => {
      const result = serializeENSApiPublicConfig(MOCK_ENSAPI_PUBLIC_CONFIG);

      expect(result).toEqual({
        version: "0.36.0",
        theGraphFallback: {
          canFallback: false,
          reason: "no-api-key",
        },
        ensIndexerPublicConfig: {
          namespace: ENSNamespaceIds.Mainnet,
          databaseSchemaName: "ensapi",
          indexedChainIds: [1],
          isSubgraphCompatible: false,
          labelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
          plugins: [PluginName.Subgraph],
          versionInfo: {
            ensDb: "0.36.0",
            ensIndexer: "0.36.0",
            ensRainbow: "0.36.0",
            ensRainbowSchema: 1,
            ensNormalize: "1.1.1",
            nodejs: "20.0.0",
            ponder: "0.5.0",
          },
        },
      });
    });
  });

  describe("deserializeENSApiPublicConfig", () => {
    it("deserializes ENSAPI public config correctly", () => {
      const serialized = serializeENSApiPublicConfig(MOCK_ENSAPI_PUBLIC_CONFIG);
      const result = deserializeENSApiPublicConfig(serialized);

      expect(result).toEqual(MOCK_ENSAPI_PUBLIC_CONFIG);
    });

    it("handles validation errors with custom value label", () => {
      const invalidConfig = {
        ...MOCK_SERIALIZED_ENSAPI_PUBLIC_CONFIG,
        version: "", // Invalid: empty string
      };

      expect(() => deserializeENSApiPublicConfig(invalidConfig, "testConfig")).toThrow(
        /testConfig.version/,
      );
    });
  });

  describe("round-trip conversion", () => {
    it("maintains data integrity through serialize -> deserialize cycle", () => {
      const serialized = serializeENSApiPublicConfig(MOCK_ENSAPI_PUBLIC_CONFIG);
      const deserialized = deserializeENSApiPublicConfig(serialized);

      expect(deserialized).toStrictEqual(MOCK_ENSAPI_PUBLIC_CONFIG);
    });
  });
});
