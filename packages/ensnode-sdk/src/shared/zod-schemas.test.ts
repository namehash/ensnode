import { describe, expect, it } from "vitest";
import { type ZodSafeParseResult, prettifyError } from "zod/v4";
import {
  makeBooleanStringSchema,
  makeChainIdSchema,
  makeChainIdStringSchema,
  makeDatetimeSchema,
  makeIntegerSchema,
  makeNonNegativeIntegerSchema,
  makePositiveIntegerSchema,
  makeUnixTimestampSchema,
  makeUrlSchema,
} from "./zod-schemas";

describe("ENSIndexer: Shared", () => {
  describe("Zod Schemas", () => {
    const formatParseError = <T>(zodParseError: ZodSafeParseResult<T>) =>
      prettifyError(zodParseError.error!);

    describe("Parsing", () => {
      it("can parse boolean string values", () => {
        expect(makeBooleanStringSchema().parse("true")).toBe(true);
        expect(makeBooleanStringSchema().parse("false")).toBe(false);

        const errorMessage = "Value must be 'true' or 'false'.";

        expect(formatParseError(makeBooleanStringSchema().safeParse("1"))).toContain(errorMessage);
        expect(formatParseError(makeBooleanStringSchema().safeParse("0"))).toContain(errorMessage);
        expect(formatParseError(makeBooleanStringSchema().safeParse("yes"))).toContain(
          errorMessage,
        );
        expect(formatParseError(makeBooleanStringSchema().safeParse("no"))).toContain(errorMessage);
        expect(formatParseError(makeBooleanStringSchema().safeParse("on"))).toContain(errorMessage);
        expect(formatParseError(makeBooleanStringSchema().safeParse("off"))).toContain(
          errorMessage,
        );
      });

      it("can parse integer values", () => {
        expect(makeIntegerSchema().parse(-1)).toBe(-1);
        expect(makeIntegerSchema().parse(0)).toBe(0);
        expect(makeIntegerSchema().parse(1)).toBe(1);
      });

      it("can parse positive integer values", () => {
        expect(makePositiveIntegerSchema().parse(1)).toBe(1);

        const errorMessage = "Value must be a positive integer (>0).";

        expect(formatParseError(makePositiveIntegerSchema().safeParse(-1))).toContain(errorMessage);
        expect(formatParseError(makePositiveIntegerSchema().safeParse(0))).toContain(errorMessage);
      });

      it("can parse non-negative integer values", () => {
        expect(makeNonNegativeIntegerSchema().parse(0)).toBe(0);
        expect(makeNonNegativeIntegerSchema().parse(1)).toBe(1);

        expect(formatParseError(makeNonNegativeIntegerSchema().safeParse(-1))).toContain("");
      });

      it("can parse Chain ID values", () => {
        expect(makeChainIdSchema().parse(1)).toBe(1);
        expect(makeChainIdSchema().parse(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);

        const errorMessage = "Chain ID must be a positive integer (>0).";

        expect(formatParseError(makeChainIdSchema().safeParse(-1))).toContain(errorMessage);
        expect(formatParseError(makeChainIdSchema().safeParse(0))).toContain(errorMessage);
      });

      it("can parse Chain ID String values", () => {
        expect(makeChainIdStringSchema().parse("1")).toBe(1);
        expect(makeChainIdStringSchema().parse(`${Number.MAX_SAFE_INTEGER}`)).toBe(
          Number.MAX_SAFE_INTEGER,
        );

        const errorMessage =
          "The numeric value represented by Chain ID String must be a positive integer (>0).";

        expect(formatParseError(makeChainIdStringSchema().safeParse("-1"))).toContain(errorMessage);
        expect(formatParseError(makeChainIdStringSchema().safeParse("0"))).toContain(errorMessage);
      });

      it("can parse datetime values", () => {
        expect(makeDatetimeSchema().parse("2020-02-02T02:22:59.123Z")).toStrictEqual(
          new Date(Date.UTC(2020, 1, 2, 2, 22, 59, 123)),
        );

        const errorMessage = "Datetime string must be a string in ISO 8601 format.";

        expect(
          formatParseError(makeDatetimeSchema().safeParse("202-02-02T02:22:59.123Z")),
        ).toContain(errorMessage);
        expect(
          formatParseError(makeDatetimeSchema().safeParse("2022-02-02T32:22:59.123Z")),
        ).toContain(errorMessage);
        expect(
          formatParseError(makeDatetimeSchema().safeParse("2022-02-02T22:62:59.123Z")),
        ).toContain(errorMessage);
        expect(
          formatParseError(makeDatetimeSchema().safeParse("2022-02-02T02:22:60.123Z")),
        ).toContain(errorMessage);
      });

      it("can parse unix timestamp values", () => {
        expect(makeUnixTimestampSchema().parse(-1)).toBe(-1);
        expect(makeUnixTimestampSchema().parse(0)).toBe(0);
        expect(makeUnixTimestampSchema().parse(1)).toBe(1);
      });

      it("can parse URL values", () => {
        expect(makeUrlSchema().parse("https://example.com")).toStrictEqual(
          new URL("https://example.com"),
        );

        const errorMessage =
          "Value must be a valid URL string (e.g., http://localhost:8080 or https://example.com).";

        expect(formatParseError(makeUrlSchema().safeParse("https://"))).toContain(errorMessage);
        expect(formatParseError(makeUrlSchema().safeParse("example.com"))).toContain(errorMessage);
      });
    });

    describe("Useful error messages", () => {
      it("can apply custom value labels", () => {
        expect(formatParseError(makeChainIdStringSchema().safeParse("notanumber"))).toContain(
          "Chain ID String must represent a positive integer (>0).",
        );
        expect(formatParseError(makeChainIdStringSchema().safeParse("-1"))).toContain(
          "The numeric value represented by Chain ID String must be a positive integer (>0).",
        );
      });
    });
  });
});
