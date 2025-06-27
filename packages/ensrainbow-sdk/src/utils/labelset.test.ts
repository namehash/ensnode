import { describe, expect, it } from "vitest";
import {
  type EnsRainbowClientLabelSet,
  type EnsRainbowServerLabelSet,
  buildEnsRainbowClientLabelSet,
  buildLabelSetId,
  buildLabelSetVersion,
  validateSupportedLabelSet,
} from "./labelset";

describe("buildLabelSetId", () => {
  it("should return a valid label set id", () => {
    expect(buildLabelSetId("subgraph")).toBe("subgraph");
  });

  it("should return a valid label set id with a hyphen", () => {
    expect(buildLabelSetId("my-label-set")).toBe("my-label-set");
  });

  it("should throw an error for an empty string", () => {
    expect(() => buildLabelSetId("")).toThrow(
      "LabelSetId must be between 1 and 50 characters long.",
    );
  });

  it("should throw an error for a string that is too long", () => {
    const longString = "a".repeat(51);
    expect(() => buildLabelSetId(longString)).toThrow(
      "LabelSetId must be between 1 and 50 characters long.",
    );
  });

  it("should throw an error for a string with uppercase letters", () => {
    expect(() => buildLabelSetId("Subgraph")).toThrow(
      "LabelSetId can only contain lowercase letters (a-z) and hyphens (-).",
    );
  });

  it("should throw an error for a string with numbers", () => {
    expect(() => buildLabelSetId("subgraph-1")).toThrow(
      "LabelSetId can only contain lowercase letters (a-z) and hyphens (-).",
    );
  });

  it("should throw an error for a string with symbols", () => {
    expect(() => buildLabelSetId("subgraph_1")).toThrow(
      "LabelSetId can only contain lowercase letters (a-z) and hyphens (-).",
    );
  });

  it("should throw an error for a non-string input", () => {
    expect(() => buildLabelSetId(123 as any)).toThrow(
      "LabelSetId must be a string.",
    );
  });
});

describe("buildLabelSetVersion", () => {
  it("should return a valid label set version for a non-negative integer", () => {
    expect(buildLabelSetVersion(0)).toBe(0);
    expect(buildLabelSetVersion(100)).toBe(100);
  });

  it("should throw an error for a negative number", () => {
    expect(() => buildLabelSetVersion(-1)).toThrow(
      "LabelSetVersion must be a non-negative integer.",
    );
  });

  it("should throw an error for a floating-point number", () => {
    expect(() => buildLabelSetVersion(1.5)).toThrow(
      "LabelSetVersion must be a non-negative integer.",
    );
  });

  it("should throw an error for a non-number input", () => {
    expect(() => buildLabelSetVersion("1" as any)).toThrow(
      "LabelSetVersion must be a non-negative integer.",
    );
  });
});

describe("buildEnsRainbowClientLabelSet", () => {
  it("should return a valid label set object", () => {
    expect(buildEnsRainbowClientLabelSet("subgraph", 0)).toEqual({
      labelSetId: "subgraph",
      labelSetVersion: 0,
    });
  });

  it("should allow only labelSetId", () => {
    expect(buildEnsRainbowClientLabelSet("subgraph")).toEqual({
      labelSetId: "subgraph",
    });
  });

  it("should allow both labelSetId and labelSetVersion to be undefined", () => {
    expect(buildEnsRainbowClientLabelSet()).toEqual({});
  });

  it("should throw an error if labelSetVersion is provided without labelSetId", () => {
    expect(() => buildEnsRainbowClientLabelSet(undefined, 0)).toThrow(
      "When a labelSetVersion is provided, labelSetId must also be provided.",
    );
  });
});

describe("validateSupportedLabelSet", () => {
  const serverSet: EnsRainbowServerLabelSet = {
    labelSetId: "subgraph",
    highestLabelSetVersion: 1,
  };

  it("should not throw if client set is empty", () => {
    expect(() => validateSupportedLabelSet(serverSet, {})).not.toThrow();
  });

  it("should not throw if labelSetIds match and client has no version", () => {
    const clientSet: EnsRainbowClientLabelSet = { labelSetId: "subgraph" };
    expect(() => validateSupportedLabelSet(serverSet, clientSet)).not.toThrow();
  });

  it("should not throw if labelSetIds match and client version is supported", () => {
    const clientSet: EnsRainbowClientLabelSet = {
      labelSetId: "subgraph",
      labelSetVersion: 1,
    };
    expect(() => validateSupportedLabelSet(serverSet, clientSet)).not.toThrow();
  });

  it("should not throw if client version is lower than server version", () => {
    const clientSet: EnsRainbowClientLabelSet = {
      labelSetId: "subgraph",
      labelSetVersion: 0,
    };
    expect(() => validateSupportedLabelSet(serverSet, clientSet)).not.toThrow();
  });

  it("should throw if labelSetIds do not match", () => {
    const clientSet: EnsRainbowClientLabelSet = { labelSetId: "other" };
    expect(() => validateSupportedLabelSet(serverSet, clientSet)).toThrow(
      'Server label set ID "subgraph" does not match client\'s requested label set ID "other".',
    );
  });

  it("should throw if client version is higher than server version", () => {
    const clientSet: EnsRainbowClientLabelSet = {
      labelSetId: "subgraph",
      labelSetVersion: 2,
    };
    expect(() => validateSupportedLabelSet(serverSet, clientSet)).toThrow(
      'Server highest label set version 1 is less than client\'s requested version 2 for label set ID "subgraph".',
    );
  });
});
