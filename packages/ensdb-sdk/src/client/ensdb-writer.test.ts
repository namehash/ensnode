import { migrate } from "drizzle-orm/node-postgres/migrator";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deserializeCrossChainIndexingStatusSnapshot,
  serializeCrossChainIndexingStatusSnapshot,
  serializeEnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import * as ensIndexerSchema from "../ensindexer-abstract";
import * as ensNodeSchema from "../ensnode";
import * as ensDbClientMock from "./ensdb-client.mock";
import { EnsDbWriter } from "./ensdb-writer";
import { EnsNodeMetadataKeys } from "./ensnode-metadata";

vi.mock("drizzle-orm/node-postgres/migrator", () => ({ migrate: vi.fn() }));

describe("EnsDbWriter", () => {
  const onConflictDoUpdateMock = vi.fn(async () => undefined);
  const valuesMock = vi.fn(() => ({ onConflictDoUpdate: onConflictDoUpdateMock }));
  const insertMock = vi.fn(() => ({ values: valuesMock }));
  const drizzleClientMock = { insert: insertMock } as any;
  const ensIndexerSchemaMock = ensIndexerSchema as any;
  const ensNodeSchemaMock = ensNodeSchema as any;

  const createEnsDbWriter = () =>
    new EnsDbWriter(
      drizzleClientMock,
      ensIndexerSchemaMock,
      ensDbClientMock.ensIndexerSchemaName,
      ensNodeSchemaMock,
    );

  beforeEach(() => {
    onConflictDoUpdateMock.mockClear();
    valuesMock.mockClear();
    insertMock.mockClear();
    vi.mocked(migrate).mockClear();
  });

  describe("upsertEnsDbVersion", () => {
    it("writes the database version metadata", async () => {
      await createEnsDbWriter().upsertEnsDbVersion("0.2.0");

      expect(insertMock).toHaveBeenCalledWith(ensNodeSchemaMock.metadata);
      expect(valuesMock).toHaveBeenCalledWith({
        ensIndexerSchemaName: ensDbClientMock.ensIndexerSchemaName,
        key: EnsNodeMetadataKeys.EnsDbVersion,
        value: "0.2.0",
      });
      expect(onConflictDoUpdateMock).toHaveBeenCalledWith({
        target: [ensNodeSchemaMock.metadata.ensIndexerSchemaName, ensNodeSchemaMock.metadata.key],
        set: { value: "0.2.0" },
      });
    });
  });

  describe("upsertEnsIndexerPublicConfig", () => {
    it("serializes and writes the public config", async () => {
      const expectedValue = serializeEnsIndexerPublicConfig(ensDbClientMock.publicConfig);

      await createEnsDbWriter().upsertEnsIndexerPublicConfig(ensDbClientMock.publicConfig);

      expect(valuesMock).toHaveBeenCalledWith({
        ensIndexerSchemaName: ensDbClientMock.ensIndexerSchemaName,
        key: EnsNodeMetadataKeys.EnsIndexerPublicConfig,
        value: expectedValue,
      });
    });
  });

  describe("upsertIndexingStatusSnapshot", () => {
    it("serializes and writes the indexing status snapshot", async () => {
      const snapshot = deserializeCrossChainIndexingStatusSnapshot(
        ensDbClientMock.serializedSnapshot,
      );
      const expectedValue = serializeCrossChainIndexingStatusSnapshot(snapshot);

      await createEnsDbWriter().upsertIndexingStatusSnapshot(snapshot);

      expect(valuesMock).toHaveBeenCalledWith({
        ensIndexerSchemaName: ensDbClientMock.ensIndexerSchemaName,
        key: EnsNodeMetadataKeys.EnsIndexerIndexingStatus,
        value: expectedValue,
      });
    });
  });

  describe("migrateEnsNodeSchema", () => {
    it("calls drizzle-orm migrateEnsNodeSchema with the correct parameters", async () => {
      const migrationsDirPath = "/path/to/migrations";

      await createEnsDbWriter().migrateEnsNodeSchema(migrationsDirPath);

      expect(vi.mocked(migrate)).toHaveBeenCalledWith(drizzleClientMock, {
        migrationsFolder: migrationsDirPath,
        migrationsSchema: "ensnode",
      });
    });

    it("propagates errors from the migrateEnsNodeSchema function", async () => {
      const migrationsDirPath = "/path/to/migrations";
      vi.mocked(migrate).mockRejectedValueOnce(new Error("Migration failed"));

      await expect(createEnsDbWriter().migrateEnsNodeSchema(migrationsDirPath)).rejects.toThrow(
        "Migration failed",
      );
    });
  });
});
