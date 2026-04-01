import { describe, expect, it } from "vitest";
import { prettifyError, type ZodSafeParseResult } from "zod/v4";

import { buildUnvalidatedEnsIndexerPublicConfig } from "./deserialize";
import type { SerializedEnsIndexerPublicConfig } from "./serialized-types";
import { type EnsIndexerVersionInfo, PluginName } from "./types";
import {
  makeDatabaseSchemaNameSchema,
  makeEnsIndexerPublicConfigSchema,
  makeEnsIndexerVersionInfoSchema,
  makeFullyPinnedLabelSetSchema,
  makeIndexedChainIdsSchema,
  makePluginsListSchema,
  makeSerializedEnsIndexerPublicConfigSchema,
} from "./zod-schemas";

describe("ENSIndexer: Config", () => {
  describe("Zod Schemas", () => {
    const formatParseError = <T>(zodParseError: ZodSafeParseResult<T>) =>
      prettifyError(zodParseError.error!);

    describe("Parsing", () => {
      it("can parse database schema name values", () => {
        expect(makeDatabaseSchemaNameSchema().parse("public")).toBe("public");
        expect(makeDatabaseSchemaNameSchema().parse("the_schema")).toBe("the_schema");
        expect(makeDatabaseSchemaNameSchema().parse("theSchema")).toBe("theSchema");

        expect(formatParseError(makeDatabaseSchemaNameSchema().safeParse(1))).toContain(
          "Database schema name must be a string",
        );
      });

      it("can parse a list of plugin name values", () => {
        expect(
          makePluginsListSchema().parse([
            `${PluginName.Subgraph}`,
            `${PluginName.Registrars}`,
            `${PluginName.ProtocolAcceleration}`,
          ]),
        ).toStrictEqual([
          PluginName.Subgraph,
          PluginName.Registrars,
          PluginName.ProtocolAcceleration,
        ]);

        expect(
          formatParseError(
            makePluginsListSchema().safeParse([
              `${PluginName.Subgraph}`,
              `${PluginName.Registrars}`,
              `${PluginName.Subgraph}`,
            ]),
          ),
        ).toContain("Plugins cannot contain duplicate values");

        expect(formatParseError(makePluginsListSchema().safeParse([]))).toMatch(
          /Plugins must be a list of strings with at least one string value/,
        );
      });

      it("can parse indexed chain ID values", () => {
        expect(makeIndexedChainIdsSchema().parse(new Set([1, 10, 8543]))).toStrictEqual(
          new Set([1, 10, 8543]),
        );

        expect(formatParseError(makeIndexedChainIdsSchema().safeParse("1,10"))).toContain(
          "Indexed Chain IDs must be a set",
        );

        expect(formatParseError(makeIndexedChainIdsSchema().safeParse(new Set([])))).toContain(
          "Indexed Chain IDs must be a set with at least one chain ID.",
        );
      });

      it("can parse label set configuration values", () => {
        expect(
          makeFullyPinnedLabelSetSchema().parse({
            labelSetId: "subgraph",
            labelSetVersion: 0,
          }),
        ).toStrictEqual({
          labelSetId: "subgraph",
          labelSetVersion: 0,
        });

        expect(
          formatParseError(
            makeFullyPinnedLabelSetSchema().safeParse({
              labelSetId: "",
              labelSetVersion: 0,
            }),
          ),
        ).toContain("labelSetId must be 1-50 characters long");

        expect(
          formatParseError(
            makeFullyPinnedLabelSetSchema().safeParse({
              labelSetId: "subgraph",
              labelSetVersion: -1,
            }),
          ),
        ).toContain("labelSetVersion must be a non-negative integer");
      });

      it("can parse version info values", () => {
        expect(
          makeEnsIndexerVersionInfoSchema().parse({
            ponder: "0.11.25",
            ensDb: "0.32.0",
            ensIndexer: "0.32.0",
            ensNormalize: "1.11.1",
          } satisfies EnsIndexerVersionInfo),
        ).toStrictEqual({
          ponder: "0.11.25",
          ensDb: "0.32.0",
          ensIndexer: "0.32.0",
          ensNormalize: "1.11.1",
        } satisfies EnsIndexerVersionInfo);

        expect(
          formatParseError(
            makeEnsIndexerVersionInfoSchema().safeParse({
              ponder: "",
              ensDb: "",
              ensIndexer: "",
              ensNormalize: "",
            } satisfies EnsIndexerVersionInfo),
          ),
        ).toStrictEqual(`✖ Value must be a non-empty string.
  → at ponder
✖ Value must be a non-empty string.
  → at ensDb
✖ Value must be a non-empty string.
  → at ensIndexer
✖ Value must be a non-empty string.
  → at ensNormalize`);
      });

      it("validates ensDb and ensIndexer versions match", () => {
        expect(
          formatParseError(
            makeEnsIndexerVersionInfoSchema().safeParse({
              ponder: "0.11.25",
              ensDb: "0.32.0",
              ensIndexer: "0.33.0", // Different from ensDb
              ensNormalize: "1.11.1",
            } satisfies EnsIndexerVersionInfo),
          ),
        ).toContain("`ensDb` version must be same as `ensIndexer` version");
      });

      it("validates ENSRainbow label set and version compatibility", () => {
        const baseConfig = {
          ensRainbowPublicConfig: {
            version: "0.32.0",
            labelSet: {
              labelSetId: "subgraph",
              highestLabelSetVersion: 0,
            },
            recordsCount: 100,
          },
          indexedChainIds: [1], // Use array for serialized config
          isSubgraphCompatible: false, // Set to false to bypass isSubgraphCompatible invariant
          namespace: "mainnet" as const,
          plugins: [PluginName.Subgraph, PluginName.Registrars], // Multiple plugins allowed when not subgraph compatible
          databaseSchemaName: "test_schema",
          versionInfo: {
            ponder: "0.11.25",
            ensDb: "0.32.0",
            ensIndexer: "0.32.0",
            ensNormalize: "1.11.1",
          },
        };

        // Test mismatched label set IDs
        expect(
          formatParseError(
            makeEnsIndexerPublicConfigSchema().safeParse(
              buildUnvalidatedEnsIndexerPublicConfig({
                ...baseConfig,
                labelSet: { labelSetId: "custom-labels", labelSetVersion: 0 },
              }),
            ),
          ),
        ).toContain(
          'Server label set ID "subgraph" does not match client\'s requested label set ID "custom-labels"',
        );

        // Test server version too low
        expect(
          formatParseError(
            makeEnsIndexerPublicConfigSchema().safeParse(
              buildUnvalidatedEnsIndexerPublicConfig({
                ...baseConfig,
                labelSet: { labelSetId: "subgraph", labelSetVersion: 5 },
              }),
            ),
          ),
        ).toContain("Server highest label set version 0 is less than client's requested version 5");
      });

      it("can parse full ENSIndexerPublicConfig with label set", () => {
        const validConfig = {
          ensRainbowPublicConfig: {
            version: "0.32.0",
            labelSet: {
              labelSetId: "subgraph",
              highestLabelSetVersion: 0,
            },
            recordsCount: 100,
          },
          labelSet: {
            labelSetId: "subgraph",
            labelSetVersion: 0,
          },
          indexedChainIds: [1],
          isSubgraphCompatible: true,
          namespace: "mainnet" as const,
          plugins: [PluginName.Subgraph],
          databaseSchemaName: "test_schema",
          versionInfo: {
            ponder: "0.11.25",
            ensDb: "0.32.0",
            ensIndexer: "0.32.0",
            ensNormalize: "1.11.1",
          },
        } satisfies SerializedEnsIndexerPublicConfig;

        const parsedConfig = makeSerializedEnsIndexerPublicConfigSchema().parse(validConfig);

        // Verify that the parsed config has the expected values and types
        expect(parsedConfig).toStrictEqual(validConfig);

        // Test invalid labelSetId
        expect(
          formatParseError(
            makeEnsIndexerPublicConfigSchema().safeParse(
              buildUnvalidatedEnsIndexerPublicConfig({
                ...validConfig,
                labelSet: { ...validConfig.labelSet, labelSetId: "" },
              }),
            ),
          ),
        ).toContain("labelSet.labelSetId must be 1-50 characters long");

        // Test invalid labelSetVersion
        expect(
          formatParseError(
            makeEnsIndexerPublicConfigSchema().safeParse(
              buildUnvalidatedEnsIndexerPublicConfig({
                ...validConfig,
                labelSet: {
                  ...validConfig.labelSet,
                  labelSetVersion: "not-a-number" as unknown as number,
                },
              }),
            ),
          ),
        ).toContain("labelSet.labelSetVersion must be an integer");
      });
    });

    describe("Useful error messages", () => {
      it("can apply custom value labels", () => {
        expect(
          formatParseError(makeDatabaseSchemaNameSchema("databaseSchema").safeParse("")),
        ).toContain("databaseSchema is required and must be a non-empty string.");
        expect(
          formatParseError(makeDatabaseSchemaNameSchema("DATABASE_SCHEMA env var").safeParse("")),
        ).toContain("DATABASE_SCHEMA env var is required and must be a non-empty string.");

        expect(
          formatParseError(
            makePluginsListSchema("PLUGINS env var").safeParse([
              `${PluginName.Subgraph}`,
              `${PluginName.Registrars}`,
              `${PluginName.Subgraph}`,
            ]),
          ),
        ).toContain("PLUGINS env var cannot contain duplicate values");
      });
    });
  });
});
