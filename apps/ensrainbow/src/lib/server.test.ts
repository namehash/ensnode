import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { asLiteralLabel, labelhashLiteralLabel } from "enssdk";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { labelHashToBytes } from "@ensnode/ensnode-sdk";
import { type EnsRainbowClientLabelSet, ErrorCode, StatusCode } from "@ensnode/ensrainbow-sdk";

import { ENSRainbowDB } from "./database";
import { buildEncodedVersionedRainbowRecord, type VersionedRainbowRecord } from "./rainbow-record";
import { ENSRainbowServer } from "./server";

describe("ENSRainbowServer", () => {
  describe("needToSimulateAsUnhealable", () => {
    it("should return false when client label set version is undefined", () => {
      const versionedRainbowRecord: VersionedRainbowRecord = {
        label: "test",
        labelSetVersion: 5,
      };
      const clientLabelSet: EnsRainbowClientLabelSet = {
        labelSetId: "test",
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
        labelSetId: "test",
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
        labelSetId: "test",
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
        labelSetId: "test",
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
        labelSetId: "test",
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
        labelSetId: "test",
        labelSetVersion: 0,
      };

      const result = ENSRainbowServer.needToSimulateAsUnhealable(
        versionedRainbowRecord,
        clientLabelSet,
      );

      expect(result).toBe(true);
    });
  });

  describe("heal", () => {
    let tempDir: string;
    let db: ENSRainbowDB;
    let server: ENSRainbowServer;

    const clientLabelSet: EnsRainbowClientLabelSet = {
      labelSetId: "test-label-set-id",
    };

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), "ensrainbow-test-server-heal-"));
      db = await ENSRainbowDB.create(tempDir);
      await db.setPrecalculatedRainbowRecordCount(0);
      await db.markIngestionFinished();
      await db.setLabelSetId("test-label-set-id");
      await db.setHighestLabelSetVersion(0);
      server = await ENSRainbowServer.init(db);
    });

    afterEach(async () => {
      await server.close();
      await rm(tempDir, { recursive: true, force: true });
    });

    it("should heal a label when the stored label matches the requested labelHash", async () => {
      const label = asLiteralLabel("vitalik");
      await db.addRainbowRecord(label, 0);

      await expect(
        server.heal(labelhashLiteralLabel(label), clientLabelSet),
      ).resolves.toMatchObject({
        status: StatusCode.Success,
        label,
      });
    });

    it("should reject a record whose label does not hash to the requested labelHash", async () => {
      const storedLabel = asLiteralLabel("vitalik");
      const requestedLabelHash = labelhashLiteralLabel(asLiteralLabel("ethereum"));

      const batch = db.batch();
      batch.put(
        labelHashToBytes(requestedLabelHash),
        buildEncodedVersionedRainbowRecord(storedLabel, 0),
      );
      await batch.write();

      await expect(server.heal(requestedLabelHash, clientLabelSet)).resolves.toMatchObject({
        status: StatusCode.Error,
        error: "Label not found",
        errorCode: ErrorCode.NotFound,
      });
    });
  });
});
