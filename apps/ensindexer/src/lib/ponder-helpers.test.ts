import { describe, expect, it } from "vitest";

import { buildBlockNumberRange } from "@ensnode/ponder-sdk";

import { constrainBlockrange } from "./ponder-helpers";

const UNDEFINED_BLOCKRANGE = buildBlockNumberRange(undefined, undefined);
const BLOCKRANGE_WITH_END = buildBlockNumberRange(undefined, 1234);

describe("ponder helpers", () => {
  describe("constrainBlockrange", () => {
    describe("without global range", () => {
      it("should return valid contract startBlock", () => {
        const range = constrainBlockrange(
          UNDEFINED_BLOCKRANGE,
          buildBlockNumberRange(5, undefined),
        );
        expect(range).toEqual(buildBlockNumberRange(5, undefined));
      });

      it("should return valid contract endBlock", () => {
        const range = constrainBlockrange(
          UNDEFINED_BLOCKRANGE,
          buildBlockNumberRange(undefined, 5),
        );
        expect(range).toEqual(buildBlockNumberRange(0, 5));
      });

      it("should return valid contract startBlock and endBlock", () => {
        const range = constrainBlockrange(UNDEFINED_BLOCKRANGE, buildBlockNumberRange(1, 5));
        expect(range).toEqual(buildBlockNumberRange(1, 5));
      });

      it("should handle undefined contract startBlock and endBlock", () => {
        const range = constrainBlockrange(
          UNDEFINED_BLOCKRANGE,
          buildBlockNumberRange(undefined, undefined),
        );
        expect(range).toEqual(buildBlockNumberRange(0, undefined));
      });
    });

    describe("with global range", () => {
      it("should respect global end block", () => {
        const config = constrainBlockrange(
          BLOCKRANGE_WITH_END,
          buildBlockNumberRange(5, undefined),
        );
        expect(config).toEqual(buildBlockNumberRange(5, 1234));
      });

      it("should handle undefined contract start block", () => {
        const config = constrainBlockrange(
          BLOCKRANGE_WITH_END,
          buildBlockNumberRange(undefined, undefined),
        );
        expect(config).toEqual(buildBlockNumberRange(0, 1234));
      });

      it("should use contract start block if later than global start block", () => {
        const config = constrainBlockrange(
          buildBlockNumberRange(10, 1234),
          buildBlockNumberRange(20, undefined),
        );
        expect(config).toEqual(buildBlockNumberRange(20, 1234));
      });

      it("should use global start block if later than contract start block", () => {
        const config = constrainBlockrange(
          buildBlockNumberRange(30, 1234),
          buildBlockNumberRange(20, undefined),
        );
        expect(config).toEqual(buildBlockNumberRange(30, 1234));
      });

      it("should use contract end block if earlier than global end block", () => {
        const config = constrainBlockrange(
          buildBlockNumberRange(10, 1234),
          buildBlockNumberRange(20, 5555),
        );
        expect(config).toEqual(buildBlockNumberRange(20, 1234));
      });

      it("should use global end block if earlier than contract end block", () => {
        const config = constrainBlockrange(
          buildBlockNumberRange(30, 1234),
          buildBlockNumberRange(20, undefined),
        );
        expect(config).toEqual(buildBlockNumberRange(30, 1234));
      });
    });
  });
});
