import { describe, expect, it } from "vitest";

import { ENSNamespaceIds } from "@ensnode/datasources";

import { PluginName } from "../../ensindexer/config/types";
import { deserializeEnsApiPublicConfig } from "./deserialize";
import { serializeEnsApiPublicConfig } from "./serialize";
import type { SerializedEnsApiPublicConfig } from "./serialized-types";
import type { EnsApiPublicConfig } from "./types";

const MOCK_ENSAPI_PUBLIC_CONFIG = {
  version: "0.36.0",
  theGraphFallback: {
    canFallback: false,
    reason: "no-api-key",
  },
  ensIndexerPublicConfig: {
    namespace: ENSNamespaceIds.Mainnet,
    databaseSchemaName: "ensapi",
    ensRainbowPublicConfig: {
      version: "0.36.0",
      labelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
      recordsCount: 100,
    },
    indexedChainIds: new Set([1]),
    isSubgraphCompatible: false,
    labelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
    plugins: [PluginName.Subgraph],
    versionInfo: {
      ensDb: "0.36.0",
      ensIndexer: "0.36.0",
      ensNormalize: "1.1.1",
      nodejs: "20.0.0",
      ponder: "0.5.0",
    },
  },
} satisfies EnsApiPublicConfig;

const MOCK_SERIALIZED_ENSAPI_PUBLIC_CONFIG = serializeEnsApiPublicConfig(MOCK_ENSAPI_PUBLIC_CONFIG);

describe("ENSApi Config Serialization/Deserialization", () => {
  describe("serializeEnsApiPublicConfig", () => {
    it("serializes ENSAPI public config correctly", () => {
      const result = serializeEnsApiPublicConfig(MOCK_ENSAPI_PUBLIC_CONFIG);

      expect(result).toEqual({
        version: "0.36.0",
        theGraphFallback: {
          canFallback: false,
          reason: "no-api-key",
        },
        ensIndexerPublicConfig: {
          namespace: ENSNamespaceIds.Mainnet,
          databaseSchemaName: "ensapi",
          ensRainbowPublicConfig: {
            version: "0.36.0",
            labelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
            recordsCount: 100,
          },
          indexedChainIds: [1],
          isSubgraphCompatible: false,
          labelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
          plugins: [PluginName.Subgraph],
          versionInfo: {
            ensDb: "0.36.0",
            ensIndexer: "0.36.0",
            ensNormalize: "1.1.1",
            nodejs: "20.0.0",
            ponder: "0.5.0",
          },
        },
      } satisfies SerializedEnsApiPublicConfig);
    });
  });

  describe("deserializeEnsApiPublicConfig", () => {
    it("deserializes ENSAPI public config correctly", () => {
      const serialized = serializeEnsApiPublicConfig(MOCK_ENSAPI_PUBLIC_CONFIG);
      const result = deserializeEnsApiPublicConfig(serialized);

      expect(result).toEqual(MOCK_ENSAPI_PUBLIC_CONFIG);
    });

    it("handles validation errors with custom value label", () => {
      const invalidConfig = {
        ...MOCK_SERIALIZED_ENSAPI_PUBLIC_CONFIG,
        version: "", // Invalid: empty string
      };

      expect(() => deserializeEnsApiPublicConfig(invalidConfig, "testConfig")).toThrow(
        /testConfig.version/,
      );
    });
  });

  describe("round-trip conversion", () => {
    it("maintains data integrity through serialize -> deserialize cycle", () => {
      const serialized = serializeEnsApiPublicConfig(MOCK_ENSAPI_PUBLIC_CONFIG);
      const deserialized = deserializeEnsApiPublicConfig(serialized);

      expect(deserialized).toStrictEqual(MOCK_ENSAPI_PUBLIC_CONFIG);
    });
  });
});
