import { describe, expect, it } from "vitest";

import { deserializeENSIndexerPublicConfig } from "./deserialize";
import { mockedConfig, mockedSerializedConfig } from "./mocks";
import { serializeENSIndexerPublicConfig } from "./serialize";
import type { SerializedENSIndexerPublicConfig } from "./serialized-types";
import { type ENSIndexerPublicConfig, PluginName } from "./types";

describe("ENSIndexer: Config", () => {
  const config = mockedConfig;
  const serializedConfig = mockedSerializedConfig;

  describe("serialization", () => {
    it("can serialize ENSIndexerPublicConfig", () => {
      // arrange & act
      const result = serializeENSIndexerPublicConfig(config);

      // assert
      expect(result).toStrictEqual({
        ...config,
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
    const correctSerializedConfig = serializedConfig;
    it("can deserialize SerializedENSIndexerPublicConfig", () => {
      // arrange
      const serializedConfig = structuredClone(correctSerializedConfig);

      // act
      const result = deserializeENSIndexerPublicConfig(serializedConfig);

      // assert
      expect(result).toStrictEqual({
        ...serializedConfig,
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
