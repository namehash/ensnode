import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildEnsIndexerStackInfo,
  buildIndexingMetadataContextInitialized,
  buildIndexingMetadataContextUninitialized,
  deserializeCrossChainIndexingStatusSnapshot,
  type EnsDbPublicConfig,
  serializeIndexingMetadataContext,
} from "@ensnode/ensnode-sdk";

import * as ensDbClientMock from "./ensdb-client.mock";
import { EnsDbReader } from "./ensdb-reader";

const executeMock = vi.fn();
const whereMock = vi.fn(async () => [] as Array<{ value: unknown }>);
const fromMock = vi.fn(() => ({ where: whereMock }));
const selectMock = vi.fn(() => ({ from: fromMock }));
const drizzleClientMock = { select: selectMock, execute: executeMock } as any;

vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: vi.fn(() => drizzleClientMock),
}));

describe("EnsDbReader", () => {
  const selectResult = { current: [] as Array<{ value: unknown }> };
  whereMock.mockImplementation(async () => selectResult.current);

  const createEnsDbReader = () =>
    new EnsDbReader(ensDbClientMock.ensDbUrl, ensDbClientMock.ensIndexerSchemaName);

  beforeEach(() => {
    selectResult.current = [];
    whereMock.mockClear();
    fromMock.mockClear();
    selectMock.mockClear();
    executeMock.mockClear();
  });

  describe("getters", () => {
    it("returns the ensDb drizzle client", () => {
      const ensDbReader = createEnsDbReader();
      expect(ensDbReader.ensDb).toBe(drizzleClientMock);
    });

    it("returns the ensIndexerSchema", () => {
      const ensDbReader = createEnsDbReader();
      expect(ensDbReader.ensIndexerSchema).toBeDefined();
    });

    it("returns the ensIndexerSchemaName", () => {
      const ensDbReader = createEnsDbReader();
      expect(ensDbReader.ensIndexerSchemaName).toBe(ensDbClientMock.ensIndexerSchemaName);
    });

    it("returns the ensNodeSchema", () => {
      const ensDbReader = createEnsDbReader();
      expect(ensDbReader.ensNodeSchema).toBeDefined();
    });
  });

  describe("buildEnsDbPublicConfig", () => {
    it("returns version info with the postgresql version", async () => {
      executeMock.mockResolvedValueOnce({
        rows: [
          {
            version: "PostgreSQL 17.4 (Ubuntu 17.4-0ubuntu0.22.04.1) on x86_64-pc-linux-gnu",
          },
        ],
      });

      const result = await createEnsDbReader().buildEnsDbPublicConfig();

      expect(result).toStrictEqual({
        versionInfo: {
          postgresql: "17.4",
        },
      } satisfies EnsDbPublicConfig);
      expect(executeMock).toHaveBeenCalledWith("SELECT version();");
    });

    it("throws when execute returns no rows", async () => {
      executeMock.mockResolvedValueOnce({ rows: [] });

      await expect(createEnsDbReader().buildEnsDbPublicConfig()).rejects.toThrow(
        /Failed to get PostgreSQL version/,
      );
    });

    it("throws when execute returns an invalid version string", async () => {
      executeMock.mockResolvedValueOnce({
        rows: [{ version: "invalid version string" }],
      });

      await expect(createEnsDbReader().buildEnsDbPublicConfig()).rejects.toThrow(
        /Failed to get PostgreSQL version/,
      );
    });

    it("propagates errors from execute", async () => {
      executeMock.mockRejectedValueOnce(new Error("Connection refused"));

      await expect(createEnsDbReader().buildEnsDbPublicConfig()).rejects.toThrow(
        "Connection refused",
      );
    });
  });

  describe("isHealthy", () => {
    it("returns true when execute succeeds", async () => {
      executeMock.mockResolvedValueOnce({ rows: [] });

      const result = await createEnsDbReader().isHealthy();

      expect(result).toBe(true);
    });

    it("returns false when execute fails", async () => {
      executeMock.mockRejectedValueOnce(new Error("Connection refused"));

      const result = await createEnsDbReader().isHealthy();

      expect(result).toBe(false);
    });
  });

  describe("isReady", () => {
    it("returns true when indexing metadata context is initialized", async () => {
      const indexingStatus = deserializeCrossChainIndexingStatusSnapshot(
        ensDbClientMock.serializedSnapshot,
      );
      const ensDbPublicConfig: EnsDbPublicConfig = {
        versionInfo: { postgresql: "17.4" },
      };
      const ensRainbowPublicConfig = {
        serverLabelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
        versionInfo: { ensRainbow: "1.9.0" },
      };
      const stackInfo = buildEnsIndexerStackInfo(
        ensDbPublicConfig,
        ensDbClientMock.publicConfig,
        ensRainbowPublicConfig,
      );
      const context = buildIndexingMetadataContextInitialized(indexingStatus, stackInfo);
      const serialized = serializeIndexingMetadataContext(context);
      selectResult.current = [{ value: serialized }];

      const result = await createEnsDbReader().isReady();

      expect(result).toBe(true);
    });

    it("returns false when indexing metadata context is uninitialized", async () => {
      const result = await createEnsDbReader().isReady();

      expect(result).toBe(false);
    });
  });

  describe("getIndexingMetadataContext", () => {
    it("returns an uninitialized context when no record exists", async () => {
      const ensDbReader = createEnsDbReader();
      const { ensNodeSchema } = ensDbReader;

      const result = await ensDbReader.getIndexingMetadataContext();

      expect(result).toStrictEqual(buildIndexingMetadataContextUninitialized());
      expect(selectMock).toHaveBeenCalledTimes(1);
      expect(fromMock).toHaveBeenCalledWith(ensNodeSchema.metadata);
      expect(whereMock).toHaveBeenCalled();
    });

    it("returns the deserialized initialized context when one record exists", async () => {
      const indexingStatus = deserializeCrossChainIndexingStatusSnapshot(
        ensDbClientMock.serializedSnapshot,
      );
      const ensDbPublicConfig: EnsDbPublicConfig = {
        versionInfo: { postgresql: "17.4" },
      };
      const ensRainbowPublicConfig = {
        serverLabelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
        versionInfo: { ensRainbow: "1.9.0" },
      };
      const stackInfo = buildEnsIndexerStackInfo(
        ensDbPublicConfig,
        ensDbClientMock.publicConfig,
        ensRainbowPublicConfig,
      );
      const context = buildIndexingMetadataContextInitialized(indexingStatus, stackInfo);
      const serialized = serializeIndexingMetadataContext(context);

      selectResult.current = [{ value: serialized }];

      const result = await createEnsDbReader().getIndexingMetadataContext();

      expect(result).toStrictEqual(context);
    });

    // This scenario should be impossible due to the primary key constraint on
    // the ('ensIndexerSchemaName', 'key') columns of the 'ensnode_metadata' table.
    it("throws when multiple records exist", async () => {
      selectResult.current = [{ value: "value1" }, { value: "value2" }];

      await expect(createEnsDbReader().getIndexingMetadataContext()).rejects.toThrow(
        /There must be exactly one ENSNodeMetadata record/,
      );
    });
  });
});
