import { describe, expect, it } from "vitest";

import { deserializeEnsApiPublicConfig } from "./deserialize";
import { serializeEnsApiPublicConfig } from "./serialize";
import type { SerializedEnsApiPublicConfig } from "./serialized-types";
import type { EnsApiPublicConfig } from "./types";

const MOCK_ENSAPI_PUBLIC_CONFIG = {
  versionInfo: {
    ensApi: "1.9.0",
    ensNormalize: "1.11.1",
  },
  theGraphFallback: {
    canFallback: false,
    reason: "no-api-key",
  },
} satisfies EnsApiPublicConfig;

const MOCK_SERIALIZED_ENSAPI_PUBLIC_CONFIG = serializeEnsApiPublicConfig(MOCK_ENSAPI_PUBLIC_CONFIG);

describe("ENSApi Config Serialization/Deserialization", () => {
  describe("serializeEnsApiPublicConfig", () => {
    it("serializes ENSAPI public config correctly", () => {
      const result = serializeEnsApiPublicConfig(MOCK_ENSAPI_PUBLIC_CONFIG);

      expect(result).toEqual({
        versionInfo: {
          ensApi: "1.9.0",
          ensNormalize: "1.11.1",
        },
        theGraphFallback: {
          canFallback: false,
          reason: "no-api-key",
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
        versionInfo: {
          ensApi: "",
          ensNormalize: "",
        },
      };

      expect(() => deserializeEnsApiPublicConfig(invalidConfig, "testConfig")).toThrow(
        /testConfig.versionInfo.ensApi/,
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
