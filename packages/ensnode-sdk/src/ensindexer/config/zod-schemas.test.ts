import { describe, expect, it } from "vitest";
import { type ZodSafeParseResult, prettifyError } from "zod/v4";
import { DependencyInfo, PluginName } from "./types";
import {
  makeDatabaseSchemaNameSchema,
  makeDependencyInfoSchema,
  makeENSIndexerPublicConfigSchema,
  makeIndexedChainIdsSchema,
  makeFullyPinnedLabelSetSchema,
  makePluginsListSchema,
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
            `${PluginName.Referrals}`,
            `${PluginName.ReverseResolvers}`,
          ]),
        ).toStrictEqual([PluginName.Subgraph, PluginName.Referrals, PluginName.ReverseResolvers]);

        expect(
          formatParseError(
            makePluginsListSchema().safeParse([
              `${PluginName.Subgraph}`,
              `${PluginName.Referrals}`,
              `${PluginName.Subgraph}`,
            ]),
          ),
        ).toContain("Plugins cannot contain duplicate values");

        expect(formatParseError(makePluginsListSchema().safeParse([]))).toContain(
          "Plugins must be a list with at least one valid plugin name. Valid plugins are: subgraph, basenames, lineanames, threedns, reverse-resolvers, referrals",
        );
      });

      it("can parse indexed chain ID values", () => {
        expect(makeIndexedChainIdsSchema().parse([1, 10, 8543])).toStrictEqual(
          new Set([1, 10, 8543]),
        );

        expect(formatParseError(makeIndexedChainIdsSchema().safeParse("1,10"))).toContain(
          "Indexed Chain IDs must be an array",
        );

        expect(formatParseError(makeIndexedChainIdsSchema().safeParse([]))).toContain(
          "Indexed Chain IDs list must include at least one element",
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
          makeDependencyInfoSchema().parse({
            nodejs: "v22.22.22",
            ponder: "0.11.25",
            ensRainbow: "0.32.0",
            ensRainbowSchema: 2,
          } satisfies DependencyInfo),
        ).toStrictEqual({
          nodejs: "v22.22.22",
          ponder: "0.11.25",
          ensRainbow: "0.32.0",
          ensRainbowSchema: 2,
        } satisfies DependencyInfo);

        expect(
          formatParseError(
            makeDependencyInfoSchema().safeParse({
              nodejs: "",
              ponder: "",
              ensRainbow: "",
              ensRainbowSchema: -1,
            } satisfies DependencyInfo),
          ),
        ).toStrictEqual(`✖ Value must be a non-empty string.
  → at nodejs
✖ Value must be a non-empty string.
  → at ponder
✖ Value must be a non-empty string.
  → at ensRainbow
✖ Value must be a positive integer (>0).
  → at ensRainbowSchema`);
      });

      it("can parse full ENSIndexerPublicConfig with label set", () => {
        const validConfig = {
          ensAdminUrl: "https://admin.ensnode.io",
          ensNodePublicUrl: "http://localhost:42069",
          labelSet: {
            labelSetId: "subgraph",
            labelSetVersion: 0,
          },
          healReverseAddresses: false,
          indexAdditionalResolverRecords: false,
          indexedChainIds: [1],
          isSubgraphCompatible: true,
          namespace: "mainnet" as const,
          plugins: [PluginName.Subgraph],
          databaseSchemaName: "test_schema",
          dependencyInfo: {
            nodejs: "v22.22.22",
            ponder: "0.11.25",
            ensRainbow: "0.32.0",
            ensRainbowSchema: 2,
          } satisfies DependencyInfo,
        };

        const parsedConfig = makeENSIndexerPublicConfigSchema().parse(validConfig);

        // The schema transforms URLs and arrays, so we need to check the transformed values
        expect(parsedConfig.ensAdminUrl).toBeInstanceOf(URL);
        expect(parsedConfig.ensAdminUrl.toString()).toBe("https://admin.ensnode.io/");
        expect(parsedConfig.ensNodePublicUrl).toBeInstanceOf(URL);
        expect(parsedConfig.ensNodePublicUrl.toString()).toBe("http://localhost:42069/");
        expect(parsedConfig.indexedChainIds).toBeInstanceOf(Set);
        expect(Array.from(parsedConfig.indexedChainIds)).toEqual([1]);
        expect(parsedConfig.labelSet).toEqual(validConfig.labelSet);
        expect(parsedConfig.healReverseAddresses).toBe(validConfig.healReverseAddresses);
        expect(parsedConfig.indexAdditionalResolverRecords).toBe(
          validConfig.indexAdditionalResolverRecords,
        );
        expect(parsedConfig.isSubgraphCompatible).toBe(validConfig.isSubgraphCompatible);
        expect(parsedConfig.namespace).toBe(validConfig.namespace);
        expect(parsedConfig.plugins).toEqual(validConfig.plugins);
        expect(parsedConfig.databaseSchemaName).toBe(validConfig.databaseSchemaName);
        expect(parsedConfig.dependencyInfo).toEqual(validConfig.dependencyInfo);

        // Test invalid labelSetId
        expect(
          formatParseError(
            makeENSIndexerPublicConfigSchema().safeParse({
              ...validConfig,
              labelSet: { ...validConfig.labelSet, labelSetId: "" },
            }),
          ),
        ).toContain("labelSet.labelSetId must be 1-50 characters long");

        // Test invalid labelSetVersion
        expect(
          formatParseError(
            makeENSIndexerPublicConfigSchema().safeParse({
              ...validConfig,
              labelSet: { ...validConfig.labelSet, labelSetVersion: "not-a-number" },
            }),
          ),
        ).toContain("labelSet.labelSetVersion must be a non-negative integer");
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
              `${PluginName.Referrals}`,
              `${PluginName.Subgraph}`,
            ]),
          ),
        ).toContain("PLUGINS env var cannot contain duplicate values");
      });
    });
  });
});
