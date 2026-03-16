import { beforeEach, describe, expect, it, vi } from "vitest";

import { ensNodeMetadata } from "@ensnode/ensnode-schema";
import {
  deserializeCrossChainIndexingStatusSnapshot,
  EnsNodeMetadataKeys,
  serializeCrossChainIndexingStatusSnapshot,
  serializeEnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import { makeDrizzle } from "./drizzle";
import { EnsDbClient } from "./ensdb-client";
import * as ensDbClientMock from "./ensdb-client.mock";

// Mock the config module to prevent it from trying to load actual environment variables during tests
vi.mock("@/config", () => ({ default: {} }));

// Mock the makeDrizzle function to return a mock database instance
vi.mock("./drizzle", () => ({ makeDrizzle: vi.fn() }));

describe("EnsDbClient", () => {
  // Mock database query results and methods
  const selectResult = { current: [] as Array<{ value: unknown }> };
  const whereMock = vi.fn(async () => selectResult.current);
  const fromMock = vi.fn(() => ({ where: whereMock }));
  const selectMock = vi.fn(() => ({ from: fromMock }));
  const onConflictDoUpdateMock = vi.fn(async () => undefined);
  const valuesMock = vi.fn(() => ({ onConflictDoUpdate: onConflictDoUpdateMock }));
  const insertMock = vi.fn(() => ({ values: valuesMock }));
  const executeMock = vi.fn(async () => undefined);
  const txMock = { insert: insertMock, execute: executeMock };
  const transactionMock = vi.fn(async (callback: (tx: typeof txMock) => Promise<void>) =>
    callback(txMock),
  );
  const dbMock = { select: selectMock, insert: insertMock, transaction: transactionMock };

  beforeEach(() => {
    selectResult.current = [];
    whereMock.mockClear();
    fromMock.mockClear();
    selectMock.mockClear();
    onConflictDoUpdateMock.mockClear();
    valuesMock.mockClear();
    insertMock.mockClear();
    executeMock.mockClear();
    transactionMock.mockClear();
    vi.mocked(makeDrizzle).mockReturnValue(dbMock as unknown as ReturnType<typeof makeDrizzle>);
  });

  describe("getEnsDbVersion", () => {
    it("returns undefined when no record exists", async () => {
      // arrange
      const client = new EnsDbClient(
        ensDbClientMock.databaseUrl,
        ensDbClientMock.databaseSchemaName,
      );

      // act & assert
      await expect(client.getEnsDbVersion()).resolves.toBeUndefined();

      expect(selectMock).toHaveBeenCalledTimes(1);
      expect(fromMock).toHaveBeenCalledWith(ensNodeMetadata);
    });

    it("returns value when one record exists", async () => {
      // arrange
      selectResult.current = [{ value: "0.1.0" }];

      const client = new EnsDbClient(
        ensDbClientMock.databaseUrl,
        ensDbClientMock.databaseSchemaName,
      );

      // act & assert
      await expect(client.getEnsDbVersion()).resolves.toBe("0.1.0");
    });

    // This scenario should be impossible due to the primary key constraint on
    // the 'key' column of 'ensnode_metadata' table.
    it("throws when multiple records exist", async () => {
      // arrange
      selectResult.current = [{ value: "0.1.0" }, { value: "0.1.1" }];

      const client = new EnsDbClient(
        ensDbClientMock.databaseUrl,
        ensDbClientMock.databaseSchemaName,
      );

      // act & assert
      await expect(client.getEnsDbVersion()).rejects.toThrowError(/ensdb_version/i);
    });
  });

  describe("getEnsIndexerPublicConfig", () => {
    it("returns undefined when no record exists", async () => {
      // arrange
      const client = new EnsDbClient(
        ensDbClientMock.databaseUrl,
        ensDbClientMock.databaseSchemaName,
      );

      // act & assert
      await expect(client.getEnsIndexerPublicConfig()).resolves.toBeUndefined();
    });

    it("deserializes the stored config", async () => {
      // arrange
      const serializedConfig = serializeEnsIndexerPublicConfig(ensDbClientMock.publicConfig);
      selectResult.current = [{ value: serializedConfig }];

      const client = new EnsDbClient(
        ensDbClientMock.databaseUrl,
        ensDbClientMock.databaseSchemaName,
      );

      // act & assert
      await expect(client.getEnsIndexerPublicConfig()).resolves.toStrictEqual(
        ensDbClientMock.publicConfig,
      );
    });
  });

  describe("getIndexingStatusSnapshot", () => {
    it("deserializes the stored indexing status snapshot", async () => {
      // arrange
      selectResult.current = [{ value: ensDbClientMock.serializedSnapshot }];

      const client = new EnsDbClient(
        ensDbClientMock.databaseUrl,
        ensDbClientMock.databaseSchemaName,
      );
      const expected = deserializeCrossChainIndexingStatusSnapshot(
        ensDbClientMock.serializedSnapshot,
      );

      // act & assert
      await expect(client.getIndexingStatusSnapshot()).resolves.toStrictEqual(expected);
    });
  });

  describe("upsertEnsDbVersion", () => {
    it("writes the database version metadata", async () => {
      // arrange
      const client = new EnsDbClient(
        ensDbClientMock.databaseUrl,
        ensDbClientMock.databaseSchemaName,
      );

      // act
      await client.upsertEnsDbVersion("0.2.0");

      // assert
      expect(insertMock).toHaveBeenCalledWith(ensNodeMetadata);
      expect(valuesMock).toHaveBeenCalledWith({
        key: EnsNodeMetadataKeys.EnsDbVersion,
        value: "0.2.0",
      });
      expect(onConflictDoUpdateMock).toHaveBeenCalledWith({
        target: ensNodeMetadata.key,
        set: { value: "0.2.0" },
      });
    });
  });

  describe("upsertEnsIndexerPublicConfig", () => {
    it("serializes and writes the public config", async () => {
      // arrange
      const client = new EnsDbClient(
        ensDbClientMock.databaseUrl,
        ensDbClientMock.databaseSchemaName,
      );
      const expectedValue = serializeEnsIndexerPublicConfig(ensDbClientMock.publicConfig);

      // act
      await client.upsertEnsIndexerPublicConfig(ensDbClientMock.publicConfig);

      // assert
      expect(valuesMock).toHaveBeenCalledWith({
        key: EnsNodeMetadataKeys.EnsIndexerPublicConfig,
        value: expectedValue,
      });
    });
  });

  describe("upsertIndexingStatusSnapshot", () => {
    it("serializes and writes the indexing status snapshot", async () => {
      // arrange
      const client = new EnsDbClient(
        ensDbClientMock.databaseUrl,
        ensDbClientMock.databaseSchemaName,
      );
      const snapshot = deserializeCrossChainIndexingStatusSnapshot(
        ensDbClientMock.serializedSnapshot,
      );
      const expectedValue = serializeCrossChainIndexingStatusSnapshot(snapshot);

      // act
      await client.upsertIndexingStatusSnapshot(snapshot);

      // assert
      expect(valuesMock).toHaveBeenCalledWith({
        key: EnsNodeMetadataKeys.EnsIndexerIndexingStatus,
        value: expectedValue,
      });
    });
  });
});
