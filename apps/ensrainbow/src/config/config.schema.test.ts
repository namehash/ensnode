import packageJson from "@/../package.json" with { type: "json" };

import { isAbsolute, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import type { EnsRainbowServerLabelSet } from "@ensnode/ensnode-sdk";

import { DB_SCHEMA_VERSION } from "@/lib/database";

import { buildConfigFromEnvironment } from "./config.schema";
import { ENSRAINBOW_DEFAULT_PORT, getDefaultDataDir } from "./defaults";
import type { ENSRainbowEnvironment } from "./environment";
import { buildENSRainbowPublicConfig } from "./public";
import type { ArgsConfig, ENSRainbowEnvConfig } from "./types";

describe("buildConfigFromEnvironment", () => {
  describe("Success cases", () => {
    it("returns a valid config with all defaults when environment is empty", () => {
      const env: ENSRainbowEnvironment = {};

      const config = buildConfigFromEnvironment(env);

      expect(config).toStrictEqual({
        port: ENSRAINBOW_DEFAULT_PORT,
        dataDir: getDefaultDataDir(),
        dbSchemaVersion: DB_SCHEMA_VERSION,
      });
    });

    it("applies custom port when PORT is set", () => {
      const env: ENSRainbowEnvironment = {
        PORT: "5000",
      };

      const config = buildConfigFromEnvironment(env);

      expect(config.port).toBe(5000);
      expect(config.dataDir).toBe(getDefaultDataDir());
    });

    it("applies custom DATA_DIR when set", () => {
      const customDataDir = "/var/lib/ensrainbow/data";
      const env: ENSRainbowEnvironment = {
        DATA_DIR: customDataDir,
      };

      const config = buildConfigFromEnvironment(env);

      expect(config.dataDir).toBe(customDataDir);
    });

    it("normalizes relative DATA_DIR to absolute path", () => {
      const relativeDataDir = "my-data";
      const env: ENSRainbowEnvironment = {
        DATA_DIR: relativeDataDir,
      };

      const config = buildConfigFromEnvironment(env);

      expect(isAbsolute(config.dataDir)).toBe(true);
      expect(config.dataDir).toBe(resolve(process.cwd(), relativeDataDir));
    });

    it("resolves nested relative DATA_DIR correctly", () => {
      const relativeDataDir = "./data/ensrainbow/db";
      const env: ENSRainbowEnvironment = {
        DATA_DIR: relativeDataDir,
      };

      const config = buildConfigFromEnvironment(env);

      expect(isAbsolute(config.dataDir)).toBe(true);
      expect(config.dataDir).toBe(resolve(process.cwd(), relativeDataDir));
    });

    it("preserves absolute DATA_DIR", () => {
      const absoluteDataDir = "/absolute/path/to/data";
      const env: ENSRainbowEnvironment = {
        DATA_DIR: absoluteDataDir,
      };

      const config = buildConfigFromEnvironment(env);

      expect(config.dataDir).toBe(absoluteDataDir);
    });

    it("applies DB_SCHEMA_VERSION when set and matches code version", () => {
      const env: ENSRainbowEnvironment = {
        DB_SCHEMA_VERSION: DB_SCHEMA_VERSION.toString(),
      };

      const config = buildConfigFromEnvironment(env);

      expect(config.dbSchemaVersion).toBe(DB_SCHEMA_VERSION);
    });

    it("defaults DB_SCHEMA_VERSION to code version when not set", () => {
      const env: ENSRainbowEnvironment = {};

      const config = buildConfigFromEnvironment(env);

      expect(config.dbSchemaVersion).toBe(DB_SCHEMA_VERSION);
    });

    it("handles all valid configuration options together", () => {
      const env: ENSRainbowEnvironment = {
        PORT: "4444",
        DATA_DIR: "/opt/ensrainbow/data",
        DB_SCHEMA_VERSION: DB_SCHEMA_VERSION.toString(),
      };

      const config = buildConfigFromEnvironment(env);

      expect(config).toStrictEqual({
        port: 4444,
        dataDir: "/opt/ensrainbow/data",
        dbSchemaVersion: DB_SCHEMA_VERSION,
      });
    });
  });

  describe("Validation errors", () => {
    it("fails when PORT is not a number", () => {
      const env: ENSRainbowEnvironment = {
        PORT: "not-a-number",
      };

      expect(() => buildConfigFromEnvironment(env)).toThrow();
    });

    it("fails when PORT is a float", () => {
      const env: ENSRainbowEnvironment = {
        PORT: "3000.5",
      };

      expect(() => buildConfigFromEnvironment(env)).toThrow();
    });

    it("fails when PORT is less than 1", () => {
      const env: ENSRainbowEnvironment = {
        PORT: "0",
      };

      expect(() => buildConfigFromEnvironment(env)).toThrow();
    });

    it("fails when PORT is negative", () => {
      const env: ENSRainbowEnvironment = {
        PORT: "-100",
      };

      expect(() => buildConfigFromEnvironment(env)).toThrow();
    });

    it("fails when PORT is greater than 65535", () => {
      const env: ENSRainbowEnvironment = {
        PORT: "65536",
      };

      expect(() => buildConfigFromEnvironment(env)).toThrow();
    });

    it("fails when DATA_DIR is empty string", () => {
      const env: ENSRainbowEnvironment = {
        DATA_DIR: "",
      };

      expect(() => buildConfigFromEnvironment(env)).toThrow();
    });

    it("fails when DATA_DIR is only whitespace", () => {
      const env: ENSRainbowEnvironment = {
        DATA_DIR: "   ",
      };

      expect(() => buildConfigFromEnvironment(env)).toThrow();
    });

    it("fails when DB_SCHEMA_VERSION is not a number", () => {
      const env: ENSRainbowEnvironment = {
        DB_SCHEMA_VERSION: "not-a-number",
      };

      expect(() => buildConfigFromEnvironment(env)).toThrow();
    });

    it("fails when DB_SCHEMA_VERSION is a float", () => {
      const env: ENSRainbowEnvironment = {
        DB_SCHEMA_VERSION: "3.5",
      };

      expect(() => buildConfigFromEnvironment(env)).toThrow();
    });
  });

  describe("Invariant: DB_SCHEMA_VERSION must match code version", () => {
    it("fails when DB_SCHEMA_VERSION does not match code version", () => {
      const wrongVersion = DB_SCHEMA_VERSION + 1;
      const env: ENSRainbowEnvironment = {
        DB_SCHEMA_VERSION: wrongVersion.toString(),
      };

      expect(() => buildConfigFromEnvironment(env)).toThrow(/DB_SCHEMA_VERSION mismatch/);
    });

    it("passes when DB_SCHEMA_VERSION matches code version", () => {
      const env: ENSRainbowEnvironment = {
        DB_SCHEMA_VERSION: DB_SCHEMA_VERSION.toString(),
      };

      const config = buildConfigFromEnvironment(env);

      expect(config.dbSchemaVersion).toBe(DB_SCHEMA_VERSION);
    });

    it("passes when DB_SCHEMA_VERSION defaults to code version", () => {
      const env: ENSRainbowEnvironment = {};

      const config = buildConfigFromEnvironment(env);

      expect(config.dbSchemaVersion).toBe(DB_SCHEMA_VERSION);
    });
  });

  describe("Edge cases", () => {
    it("handles PORT at minimum valid value (1)", () => {
      const env: ENSRainbowEnvironment = {
        PORT: "1",
      };

      const config = buildConfigFromEnvironment(env);

      expect(config.port).toBe(1);
    });

    it("handles PORT at maximum valid value (65535)", () => {
      const env: ENSRainbowEnvironment = {
        PORT: "65535",
      };

      const config = buildConfigFromEnvironment(env);

      expect(config.port).toBe(65535);
    });

    it("trims whitespace from DATA_DIR", () => {
      const dataDir = "/my/path/to/data";
      const env: ENSRainbowEnvironment = {
        DATA_DIR: `  ${dataDir}  `,
      };

      const config = buildConfigFromEnvironment(env);

      expect(config.dataDir).toBe(dataDir);
    });

    it("handles DATA_DIR with .. (parent directory)", () => {
      const relativeDataDir = "../data";
      const env: ENSRainbowEnvironment = {
        DATA_DIR: relativeDataDir,
      };

      const config = buildConfigFromEnvironment(env);

      expect(isAbsolute(config.dataDir)).toBe(true);
      expect(config.dataDir).toBe(resolve(process.cwd(), relativeDataDir));
    });

    it("handles DATA_DIR with ~ (not expanded, treated as relative)", () => {
      // Note: The config schema does NOT expand ~ to home directory
      // It would be treated as a relative path
      const tildeDataDir = "~/data";
      const env: ENSRainbowEnvironment = {
        DATA_DIR: tildeDataDir,
      };

      const config = buildConfigFromEnvironment(env);

      expect(isAbsolute(config.dataDir)).toBe(true);
      // ~ is treated as a directory name, not home expansion
      expect(config.dataDir).toBe(resolve(process.cwd(), tildeDataDir));
    });
  });
});

describe("buildENSRainbowPublicConfig", () => {
  const labelSet: EnsRainbowServerLabelSet = {
    labelSetId: "subgraph",
    highestLabelSetVersion: 0,
  };
  const recordsCount = 1000;

  describe("Success cases", () => {
    it("returns a valid ENSRainbow public config with correct structure", () => {
      const mockConfig: ENSRainbowEnvConfig = {
        port: ENSRAINBOW_DEFAULT_PORT,
        dataDir: getDefaultDataDir(),
        dbSchemaVersion: DB_SCHEMA_VERSION,
      };

      const result = buildENSRainbowPublicConfig(mockConfig, labelSet, recordsCount);

      expect(result).toStrictEqual({
        version: packageJson.version,
        labelSet,
        recordsCount,
      });
    });

    it("accepts ArgsConfig (effective config: merge of CLI args and EnvConfig)", () => {
      const argsConfig: ArgsConfig = {
        port: 4000,
        dataDir: getDefaultDataDir(),
        dbSchemaVersion: DB_SCHEMA_VERSION,
      };

      const result = buildENSRainbowPublicConfig(argsConfig, labelSet, recordsCount);

      expect(result.version).toBe(packageJson.version);
      expect(result.labelSet).toStrictEqual(labelSet);
      expect(result.recordsCount).toBe(recordsCount);
    });
  });
});
