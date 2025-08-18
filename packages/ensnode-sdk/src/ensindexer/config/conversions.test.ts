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
        experimentalResolution: false,
        healReverseAddresses: false,
        indexAdditionalResolverRecords: false,
        indexedChainIds: new Set([1]),
        isSubgraphCompatible: true,
        namespace: "mainnet",
        plugins: [PluginName.Subgraph],
        dependencyInfo: {
          ensRainbow: "0.32.0",
          ensRainbowSchema: 2,
          nodejs: "v22.10.12",
          ponder: "0.11.25",
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
      experimentalResolution: false,
      healReverseAddresses: false,
      indexAdditionalResolverRecords: false,
      indexedChainIds: [1, 10, 8453],
      isSubgraphCompatible: true,
      namespace: "mainnet",
      plugins: [PluginName.Subgraph],
      dependencyInfo: {
        ensRainbow: "0.32.0",
        ensRainbowSchema: 2,
        nodejs: "v22.10.12",
        ponder: "0.11.25",
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

    const errorMessage = `Cannot deserialize ENSIndexerPublicConfig:
✖ 'isSubgraphCompatible' requires only the 'subgraph' plugin to be active. Also, both 'indexAdditionalResolverRecords' and 'healReverseAddresses' must be set to 'false'`;

    it("can enforce invariants: broken subgraph-compatibility (healReverseAddresses = 'true')", () => {
      // arrange
      const serializedConfig: SerializedENSIndexerPublicConfig =
        structuredClone(correctSerializedConfig);

      serializedConfig.isSubgraphCompatible = true;
      serializedConfig.healReverseAddresses = true;

      // act & assert
      expect(() => deserializeENSIndexerPublicConfig(serializedConfig)).toThrowError(errorMessage);
    });

    it("can enforce invariants: broken subgraph-compatibility (indexAdditionalResolverRecords = 'true')", () => {
      // arrange
      const serializedConfig: SerializedENSIndexerPublicConfig =
        structuredClone(correctSerializedConfig);

      serializedConfig.isSubgraphCompatible = true;
      serializedConfig.indexAdditionalResolverRecords = true;

      // act & assert
      expect(() => deserializeENSIndexerPublicConfig(serializedConfig)).toThrowError(errorMessage);
    });

    it("can enforce invariants: broken subgraph-compatibility (wrong plugins active)", () => {
      // arrange
      const serializedConfig: SerializedENSIndexerPublicConfig =
        structuredClone(correctSerializedConfig);

      serializedConfig.isSubgraphCompatible = true;
      serializedConfig.plugins.push(PluginName.Lineanames);

      // act & assert
      expect(() => deserializeENSIndexerPublicConfig(serializedConfig)).toThrowError(errorMessage);
    });

    it("can enforce invariants: reverse-resolver plugin requirements", () => {
      // arrange
      const serializedConfig: SerializedENSIndexerPublicConfig =
        structuredClone(correctSerializedConfig);

      serializedConfig.plugins.push(PluginName.ReverseResolvers);

      // act & assert
      expect(() => deserializeENSIndexerPublicConfig(serializedConfig)).toThrowError(
        `The 'reverse-resolvers' plugin requires 'indexAdditionalResolverRecords' to be 'true'`,
      );
    });

    it("can enforce invariants: experimental resolution requirements", () => {
      // arrange
      const serializedConfig: SerializedENSIndexerPublicConfig =
        structuredClone(correctSerializedConfig);

      serializedConfig.experimentalResolution = true;

      // act & assert
      expect(() => deserializeENSIndexerPublicConfig(serializedConfig)).toThrowError(
        `Cannot deserialize ENSIndexerPublicConfig:
✖ 'reverseResolversPluginActive' requires the reverse-resolvers plugin to be active.`,
      );
    });
  });
});
