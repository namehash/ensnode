import { describe, expect, it } from "vitest";

import { deserializeEnsIndexerPublicConfig } from "./deserialize";
import { serializeEnsIndexerPublicConfig } from "./serialize";
import type { SerializedEnsIndexerPublicConfig } from "./serialized-types";
import { type EnsIndexerPublicConfig, PluginName } from "./types";

describe("ENSIndexer: Config", () => {
  describe("serialization", () => {
    it("can serialize EnsIndexerPublicConfig", () => {
      // arrange
      const config = {
        databaseSchemaName: "public",
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
      } satisfies EnsIndexerPublicConfig;

      // act
      const result = serializeEnsIndexerPublicConfig(config);

      // assert
      expect(result).toStrictEqual({
        ...config,
        indexedChainIds: [1],
      } satisfies SerializedEnsIndexerPublicConfig);

      // bonus step: deserialize the serialized
      // act
      const deserializedResult = deserializeEnsIndexerPublicConfig(result);

      // assert
      expect(deserializedResult).toStrictEqual(config);
    });
  });

  describe("deserialization", () => {
    const correctSerializedConfig = {
      databaseSchemaName: "public",
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
    } satisfies SerializedEnsIndexerPublicConfig;

    it("can deserialize SerializedEnsIndexerPublicConfig", () => {
      // arrange
      const serializedConfig = structuredClone(correctSerializedConfig);

      // act
      const result = deserializeEnsIndexerPublicConfig(serializedConfig);

      // assert
      expect(result).toStrictEqual({
        ...serializedConfig,
        indexedChainIds: new Set([1, 10, 8453]),
      } satisfies EnsIndexerPublicConfig);
    });

    it("can enforce invariants: expected subgraph-compatibility", () => {
      // arrange
      const serializedConfig: SerializedEnsIndexerPublicConfig =
        structuredClone(correctSerializedConfig);

      serializedConfig.isSubgraphCompatible = true;

      // act & assert
      expect(() => deserializeEnsIndexerPublicConfig(serializedConfig)).not.toThrowError();
    });

    it("can enforce invariants: broken subgraph-compatibility (wrong plugins active)", () => {
      // arrange
      const serializedConfig: SerializedEnsIndexerPublicConfig =
        structuredClone(correctSerializedConfig);

      serializedConfig.isSubgraphCompatible = true;
      serializedConfig.plugins.push(PluginName.Lineanames);

      // act & assert
      expect(() => deserializeEnsIndexerPublicConfig(serializedConfig)).toThrowError(
        /isSubgraphCompatible/,
      );
    });
  });
});
