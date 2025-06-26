import { describe, expect, it } from "vitest";
import {
  type EnsRainbowClientLabelSet,
  type EnsRainbowServerLabelSet,
  buildEnsRainbowClientLabelSet,
  validateSupportedLabelSet,
} from "./labelset";

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

  it("should allow only labelSetVersion to be undefined", () => {
    expect(buildEnsRainbowClientLabelSet("subgraph", undefined)).toEqual({
      labelSetId: "subgraph",
    });
  });

  it("should allow both to be undefined", () => {
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

  it("should not throw if client set is not provided", () => {
    expect(() => validateSupportedLabelSet(serverSet, undefined)).not.toThrow();
  });

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
