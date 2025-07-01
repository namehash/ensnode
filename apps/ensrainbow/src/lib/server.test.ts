import type { EnsRainbowClientLabelSet } from "@ensnode/ensrainbow-sdk";
import { describe, expect, it } from "vitest";

import type { VersionedRainbowRecord } from "./rainbow-record";
import { ENSRainbowServer } from "./server";

describe("ENSRainbowServer", () => {
  describe("needToSimulateAsUnhealable", () => {
    it("should return false when client label set version is undefined", () => {
      const versionedRainbowRecord: VersionedRainbowRecord = {
        label: "test",
        labelSetVersion: 5,
      };
      const clientLabelSet: EnsRainbowClientLabelSet = {
        labelSetId: "test-id",
        // labelSetVersion is undefined
      };

      const result = ENSRainbowServer.needToSimulateAsUnhealable(
        versionedRainbowRecord,
        clientLabelSet,
      );

      expect(result).toBe(false);
    });

    it("should return false when versioned record label set version is less than client version", () => {
      const versionedRainbowRecord: VersionedRainbowRecord = {
        label: "test",
        labelSetVersion: 3,
      };
      const clientLabelSet: EnsRainbowClientLabelSet = {
        labelSetId: "test-id",
        labelSetVersion: 5,
      };

      const result = ENSRainbowServer.needToSimulateAsUnhealable(
        versionedRainbowRecord,
        clientLabelSet,
      );

      expect(result).toBe(false);
    });

    it("should return false when versioned record label set version equals client version", () => {
      const versionedRainbowRecord: VersionedRainbowRecord = {
        label: "test",
        labelSetVersion: 5,
      };
      const clientLabelSet: EnsRainbowClientLabelSet = {
        labelSetId: "test-id",
        labelSetVersion: 5,
      };

      const result = ENSRainbowServer.needToSimulateAsUnhealable(
        versionedRainbowRecord,
        clientLabelSet,
      );

      expect(result).toBe(false);
    });

    it("should return true when versioned record label set version is greater than client version", () => {
      const versionedRainbowRecord: VersionedRainbowRecord = {
        label: "test",
        labelSetVersion: 7,
      };
      const clientLabelSet: EnsRainbowClientLabelSet = {
        labelSetId: "test-id",
        labelSetVersion: 5,
      };

      const result = ENSRainbowServer.needToSimulateAsUnhealable(
        versionedRainbowRecord,
        clientLabelSet,
      );

      expect(result).toBe(true);
    });

    it("should return false when client label set version is 0 and record version is 0", () => {
      const versionedRainbowRecord: VersionedRainbowRecord = {
        label: "test",
        labelSetVersion: 0,
      };
      const clientLabelSet: EnsRainbowClientLabelSet = {
        labelSetId: "test-id",
        labelSetVersion: 0,
      };

      const result = ENSRainbowServer.needToSimulateAsUnhealable(
        versionedRainbowRecord,
        clientLabelSet,
      );

      expect(result).toBe(false);
    });

    it("should return true when client label set version is 0 and record version is greater", () => {
      const versionedRainbowRecord: VersionedRainbowRecord = {
        label: "test",
        labelSetVersion: 1,
      };
      const clientLabelSet: EnsRainbowClientLabelSet = {
        labelSetId: "test-id",
        labelSetVersion: 0,
      };

      const result = ENSRainbowServer.needToSimulateAsUnhealable(
        versionedRainbowRecord,
        clientLabelSet,
      );

      expect(result).toBe(true);
    });
  });
});
