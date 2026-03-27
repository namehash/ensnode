import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deserializeCrossChainIndexingStatusSnapshot,
  serializeEnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import { ENSDB_ROOT_SCHEMA_VERSION } from "../config";
import * as ensDbClientMock from "./ensdb-client.mock";
import { EnsDbReader } from "./ensdb-reader";

const whereMock = vi.fn(async () => [] as Array<{ value: unknown }>);
const fromMock = vi.fn(() => ({ where: whereMock }));
const selectMock = vi.fn(() => ({ from: fromMock }));
const executeMock = vi.fn(async () => ({
  rows: [] as Array<{ setting_server_version: string | number }>,
}));
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
  });

  describe("getEnsDbVersion", () => {
    it("returns undefined when no record exists", async () => {
      const ensDbClient = createEnsDbReader();
      const { ensNodeSchema } = ensDbClient;

      await expect(ensDbClient.getEnsDbVersion()).resolves.toBeUndefined();

      expect(selectMock).toHaveBeenCalledTimes(1);
      expect(fromMock).toHaveBeenCalledWith(ensNodeSchema.metadata);
    });

    it("returns value when one record exists", async () => {
      selectResult.current = [{ value: "0.1.0" }];

      await expect(createEnsDbReader().getEnsDbVersion()).resolves.toBe("0.1.0");
    });

    // This scenario should be impossible due to the primary key constraint on
    // the ('ensIndexerSchemaName', 'key') columns of the 'ensnode_metadata' table.
    it("throws when multiple records exist", async () => {
      selectResult.current = [{ value: "0.1.0" }, { value: "0.1.1" }];

      await expect(createEnsDbReader().getEnsDbVersion()).rejects.toThrowError(/ensdb_version/i);
    });
  });

  describe("getEnsIndexerPublicConfig", () => {
    it("returns undefined when no record exists", async () => {
      await expect(createEnsDbReader().getEnsIndexerPublicConfig()).resolves.toBeUndefined();
    });

    it("deserializes the stored config", async () => {
      const serializedConfig = serializeEnsIndexerPublicConfig(ensDbClientMock.publicConfig);
      selectResult.current = [{ value: serializedConfig }];

      await expect(createEnsDbReader().getEnsIndexerPublicConfig()).resolves.toStrictEqual(
        ensDbClientMock.publicConfig,
      );
    });
  });

  describe("getIndexingStatusSnapshot", () => {
    it("deserializes the stored indexing status snapshot", async () => {
      selectResult.current = [{ value: ensDbClientMock.serializedSnapshot }];

      const expected = deserializeCrossChainIndexingStatusSnapshot(
        ensDbClientMock.serializedSnapshot,
      );

      await expect(createEnsDbReader().getIndexingStatusSnapshot()).resolves.toStrictEqual(
        expected,
      );
    });
  });

  describe("getEnsDbPublicConfig", () => {
    beforeEach(() => {
      executeMock.mockClear();
    });

    it("returns public config with postgres version and root schema version", async () => {
      executeMock.mockImplementation(async () => ({
        rows: [{ setting_server_version: "17.4 (Debian 17.4-1.pgdg120+2)" }],
      }));

      const result = await createEnsDbReader().getEnsDbPublicConfig();

      expect(result).toStrictEqual({
        postgresVersion: "17.4",
        rootSchemaVersion: ENSDB_ROOT_SCHEMA_VERSION,
      });
      expect(executeMock).toHaveBeenCalledTimes(1);
    });

    it("throws when server version setting is not a string", async () => {
      executeMock.mockImplementation(async () => ({
        rows: [{ setting_server_version: 17.4 }],
      }));

      await expect(createEnsDbReader().getEnsDbPublicConfig()).rejects.toThrowError(
        "Unexpected type for server_version setting: number",
      );
    });

    it("throws when postgres version is empty", async () => {
      executeMock.mockImplementation(async () => ({
        rows: [{ setting_server_version: "" }],
      }));

      await expect(createEnsDbReader().getEnsDbPublicConfig()).rejects.toThrowError(
        "PostgreSQL version must be a non-empty string.",
      );
    });
  });

  describe("getters", () => {
    it("returns the drizzle client", () => {
      const reader = createEnsDbReader();
      expect(reader.ensDb).toBe(drizzleClientMock);
    });

    it("returns the ensIndexerSchema", () => {
      const reader = createEnsDbReader();
      expect(reader.ensIndexerSchema).toBeDefined();
    });

    it("returns the ensIndexerSchemaName", () => {
      const reader = createEnsDbReader();
      expect(reader.ensIndexerSchemaName).toBe(ensDbClientMock.ensIndexerSchemaName);
    });

    it("returns the ensNodeSchema", () => {
      const reader = createEnsDbReader();
      expect(reader.ensNodeSchema).toBeDefined();
    });
  });
});
