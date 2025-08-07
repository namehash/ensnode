import { describe, expect, it } from "vitest";
import { type ZodSafeParseResult, prettifyError } from "zod/v4";
import { DependencyInfo, PluginName } from "./types";
import {
  makeDatabaseSchemaNameSchema,
  makeDependencyInfoSchema,
  makeIndexedChainIdsSchema,
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
