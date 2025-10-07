import { describe, expect, it } from "vitest";
import { deserializeENSIndexerPublicConfig } from "./deserialize";
import { serializeENSIndexerPublicConfig } from "./serialize";
import type { SerializedENSIndexerPublicConfig } from "./serialized-types";
import { type ENSIndexerPublicConfig, PluginName } from "./types";

describe("ENSIndexer: Config", () => {
  describe("serialization", () => {
    it("can serialize ENSIndexerPublicConfig", () => {
      // arrange
      const config = {
        databaseSchemaName: "public",
        ensAdminUrl: new URL("https://admin.ensnode.io"),
        ensNodePublicUrl: new URL("https://api.alpha.ensnode.io"),
        labelSet: {
          labelSetId: "subgraph",
          labelSetVersion: 0,
        },
        indexedChainIds: new Set([1]),
        isSubgraphCompatible: true,
        namespace: "mainnet",
        plugins: [PluginName.Subgraph],
        versionInfo: {
          nodejs: "v22.10.12",
          ponder: "0.11.25",
          ensDb: "0.32.0",
          ensIndexer: "0.32.0",
          ensNormalize: "1.11.1",
          ensRainbow: "0.32.0",
          ensRainbowSchema: 2,
        },
      } satisfies ENSIndexerPublicConfig;

      // act
      const result = serializeENSIndexerPublicConfig(config);

      // assert
      expect(result).toStrictEqual({
        ...config,
        ensAdminUrl: "https://admin.ensnode.io/",
        ensNodePublicUrl: "https://api.alpha.ensnode.io/",
        indexedChainIds: [1],
      } satisfies SerializedENSIndexerPublicConfig);

      // bonus step: deserialize the serialized
      // act
      const deserializedResult = deserializeENSIndexerPublicConfig(result);

      // assert
      expect(deserializedResult).toStrictEqual(config);
    });
  });

  describe("deserialization", () => {
    const correctSerializedConfig = {
      databaseSchemaName: "public",
      ensAdminUrl: "https://admin.ensnode.io",
      ensNodePublicUrl: "https://api.alpha.ensnode.io",
      labelSet: {
        labelSetId: "subgraph",
        labelSetVersion: 0,
      },
      indexedChainIds: [1, 10, 8453],
      isSubgraphCompatible: true,
      namespace: "mainnet",
      plugins: [PluginName.Subgraph],
      versionInfo: {
        nodejs: "v22.10.12",
        ponder: "0.11.25",
        ensDb: "0.32.0",
        ensIndexer: "0.32.0",
        ensNormalize: "1.11.1",
        ensRainbow: "0.32.0",
        ensRainbowSchema: 2,
      },
    } satisfies SerializedENSIndexerPublicConfig;

    it("can deserialize SerializedENSIndexerPublicConfig", () => {
      // arrange
      const serializedConfig = structuredClone(correctSerializedConfig);

      // act
      const result = deserializeENSIndexerPublicConfig(serializedConfig);

      // assert
      expect(result).toStrictEqual({
        ...serializedConfig,
        ensAdminUrl: new URL("https://admin.ensnode.io"),
        ensNodePublicUrl: new URL("https://api.alpha.ensnode.io"),
        indexedChainIds: new Set([1, 10, 8453]),
      } satisfies ENSIndexerPublicConfig);
    });

    it("can enforce invariants: expected subgraph-compatibility", () => {
      // arrange
      const serializedConfig: SerializedENSIndexerPublicConfig =
        structuredClone(correctSerializedConfig);

      serializedConfig.isSubgraphCompatible = true;

      // act & assert
      expect(() => deserializeENSIndexerPublicConfig(serializedConfig)).not.toThrowError();
    });

    it("can enforce invariants: broken subgraph-compatibility (wrong plugins active)", () => {
      // arrange
      const serializedConfig: SerializedENSIndexerPublicConfig =
        structuredClone(correctSerializedConfig);

      serializedConfig.isSubgraphCompatible = true;
      serializedConfig.plugins.push(PluginName.Lineanames);

      // act & assert
      expect(() => deserializeENSIndexerPublicConfig(serializedConfig)).toThrowError(
        /isSubgraphCompatible/,
      );
    });
  });
});
