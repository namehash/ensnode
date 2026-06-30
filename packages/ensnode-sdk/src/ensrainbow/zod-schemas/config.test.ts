import { describe, expect, it } from "vitest";
import { prettifyError, type ZodSafeParseResult } from "zod/v4";

import { makeEnsRainbowPublicConfigSchema } from "./config";

describe("ENSRainbow: Config Zod Schemas", () => {
  const formatParseError = <T>(zodParseError: ZodSafeParseResult<T>) =>
    prettifyError(zodParseError.error!);

  describe("makeEnsRainbowPublicConfigSchema", () => {
    it("can parse a valid ENSRainbow public config", () => {
      expect(
        makeEnsRainbowPublicConfigSchema().parse({
          serverLabelSet: {
            labelSetId: "subgraph",
            highestLabelSetVersion: 0,
          },
          versionInfo: {
            commit: "f3e7c0d",
            ensRainbow: "1.9.0",
          },
        }),
      ).toStrictEqual({
        serverLabelSet: {
          labelSetId: "subgraph",
          highestLabelSetVersion: 0,
        },
        versionInfo: {
          commit: "f3e7c0d",
          ensRainbow: "1.9.0",
        },
      });
    });

    it("rejects an empty commit hash", () => {
      expect(
        formatParseError(
          makeEnsRainbowPublicConfigSchema().safeParse({
            serverLabelSet: {
              labelSetId: "subgraph",
              highestLabelSetVersion: 0,
            },
            versionInfo: {
              commit: "",
              ensRainbow: "1.9.0",
            },
          }),
        ),
      ).toContain("EnsRainbowPublicConfig.versionInfo.commit must be a non-empty string.");
    });

    it("rejects an empty ensRainbow version", () => {
      expect(
        formatParseError(
          makeEnsRainbowPublicConfigSchema().safeParse({
            serverLabelSet: {
              labelSetId: "subgraph",
              highestLabelSetVersion: 0,
            },
            versionInfo: {
              commit: "f3e7c0d",
              ensRainbow: "",
            },
          }),
        ),
      ).toContain("EnsRainbowPublicConfig.versionInfo.ensRainbow must be a non-empty string.");
    });

    it("rejects a missing versionInfo.commit", () => {
      expect(
        formatParseError(
          makeEnsRainbowPublicConfigSchema().safeParse({
            serverLabelSet: {
              labelSetId: "subgraph",
              highestLabelSetVersion: 0,
            },
            versionInfo: {
              ensRainbow: "1.9.0",
            },
          }),
        ),
      ).toContain("Invalid input: expected string, received undefined");
    });

    it("applies a custom value label in error messages", () => {
      expect(
        formatParseError(
          makeEnsRainbowPublicConfigSchema("remoteRainbow").safeParse({
            serverLabelSet: {
              labelSetId: "subgraph",
              highestLabelSetVersion: 0,
            },
            versionInfo: {
              commit: "",
              ensRainbow: "",
            },
          }),
        ),
      ).toContain("remoteRainbow.versionInfo.commit must be a non-empty string.");
    });
  });
});
