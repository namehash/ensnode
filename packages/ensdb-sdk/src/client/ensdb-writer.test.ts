import { migrate } from "drizzle-orm/node-postgres/migrator";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deserializeCrossChainIndexingStatusSnapshot,
  serializeCrossChainIndexingStatusSnapshot,
  serializeEnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import * as ensDbClientMock from "./ensdb-client.mock";
import { EnsDbWriter } from "./ensdb-writer";
import { EnsNodeMetadataKeys } from "./ensnode-metadata";

const executeMock = vi.fn(async () => undefined);
const onConflictDoUpdateMock = vi.fn(async () => undefined);
const valuesMock = vi.fn(() => ({ onConflictDoUpdate: onConflictDoUpdateMock }));
const insertMock = vi.fn(() => ({ values: valuesMock }));
const transactionMock = vi.fn(async (callback: (tx: any) => Promise<void>) => {
  const tx = { execute: executeMock, insert: insertMock };
  return callback(tx);
});
const drizzleClientMock = {
  insert: insertMock,
  transaction: transactionMock,
  execute: executeMock,
} as any;

vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: vi.fn(() => drizzleClientMock),
}));
vi.mock("drizzle-orm/node-postgres/migrator", () => ({ migrate: vi.fn() }));

describe("EnsDbWriter", () => {
  const createEnsDbWriter = () =>
    new EnsDbWriter(ensDbClientMock.ensDbUrl, ensDbClientMock.ensIndexerSchemaName);

  beforeEach(() => {
    executeMock.mockClear();
    onConflictDoUpdateMock.mockClear();
    valuesMock.mockClear();
    insertMock.mockClear();
    transactionMock.mockClear();
    vi.mocked(migrate).mockClear();
  });

  describe("upsertEnsDbVersion", () => {
    it("writes the database version metadata", async () => {
      const ensDbClient = createEnsDbWriter();
      const { ensNodeSchema } = ensDbClient;

      await ensDbClient.upsertEnsDbVersion("0.2.0");

      expect(insertMock).toHaveBeenCalledWith(ensNodeSchema.metadata);
      expect(valuesMock).toHaveBeenCalledWith({
        ensIndexerSchemaName: ensDbClientMock.ensIndexerSchemaName,
        key: EnsNodeMetadataKeys.EnsDbVersion,
        value: "0.2.0",
      });
      expect(onConflictDoUpdateMock).toHaveBeenCalledWith({
        target: [ensNodeSchema.metadata.ensIndexerSchemaName, ensNodeSchema.metadata.key],
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
    it("calls drizzle-orm migrate with the correct parameters inside a transaction", async () => {
      const migrationsDirPath = "/path/to/migrations";

      await createEnsDbWriter().migrateEnsNodeSchema(migrationsDirPath);

      expect(transactionMock).toHaveBeenCalled();
      expect(executeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          queryChunks: expect.arrayContaining([
            expect.objectContaining({ value: ["SELECT pg_advisory_xact_lock("] }),
            expect.any(BigInt),
            expect.objectContaining({ value: [")"] }),
          ]),
        }),
      );
      expect(vi.mocked(migrate)).toHaveBeenCalledWith(
        expect.objectContaining({ execute: executeMock }),
        {
          migrationsFolder: migrationsDirPath,
          migrationsSchema: "ensnode",
        },
      );
    });

    it("propagates errors from the migrate function", async () => {
      const migrationsDirPath = "/path/to/migrations";
      vi.mocked(migrate).mockRejectedValueOnce(new Error("Migration failed"));

      await expect(createEnsDbWriter().migrateEnsNodeSchema(migrationsDirPath)).rejects.toThrow(
        "Migration failed",
      );
    });
  });
});
