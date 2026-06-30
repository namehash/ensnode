import { migrate } from "drizzle-orm/node-postgres/migrator";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildEnsIndexerStackInfo,
  buildIndexingMetadataContextInitialized,
  deserializeCrossChainIndexingStatusSnapshot,
  serializeIndexingMetadataContext,
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

  describe("upsertIndexingMetadataContext", () => {
    it("serializes and writes the indexing metadata context", async () => {
      const ensDbWriter = createEnsDbWriter();
      const { ensNodeSchema } = ensDbWriter;

      const indexingStatus = deserializeCrossChainIndexingStatusSnapshot(
        ensDbClientMock.serializedSnapshot,
      );
      const ensDbPublicConfig = {
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
      const expectedValue = serializeIndexingMetadataContext(context);

      await ensDbWriter.upsertIndexingMetadataContext(context);

      expect(insertMock).toHaveBeenCalledWith(ensNodeSchema.metadata);
      expect(valuesMock).toHaveBeenCalledWith({
        ensIndexerSchemaName: ensDbClientMock.ensIndexerSchemaName,
        key: EnsNodeMetadataKeys.IndexingMetadataContext,
        value: expectedValue,
      });
      expect(onConflictDoUpdateMock).toHaveBeenCalledWith({
        target: [ensNodeSchema.metadata.ensIndexerSchemaName, ensNodeSchema.metadata.key],
        set: { value: expectedValue },
      });
    });
  });

  describe("writeEnsNodeMetadata", () => {
    it("re-keys the record to the writer's ENSIndexer schema and upserts it", async () => {
      const ensDbWriter = createEnsDbWriter();
      const { ensNodeSchema } = ensDbWriter;

      const metadata = {
        key: EnsNodeMetadataKeys.IndexingMetadataContext,
        value: { hello: "world" },
      } as any;

      await ensDbWriter.writeEnsNodeMetadata(metadata);

      expect(insertMock).toHaveBeenCalledWith(ensNodeSchema.metadata);
      expect(valuesMock).toHaveBeenCalledWith({
        ensIndexerSchemaName: ensDbClientMock.ensIndexerSchemaName,
        key: metadata.key,
        value: metadata.value,
      });
      expect(onConflictDoUpdateMock).toHaveBeenCalledWith({
        target: [ensNodeSchema.metadata.ensIndexerSchemaName, ensNodeSchema.metadata.key],
        set: { value: metadata.value },
      });
    });
  });

  describe("dropSchema", () => {
    it("executes a drop schema ... cascade statement", async () => {
      await createEnsDbWriter().dropSchema("someSchema");

      expect(executeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          queryChunks: expect.arrayContaining([
            expect.objectContaining({ value: ["drop schema if exists "] }),
            expect.objectContaining({ value: [" cascade"] }),
          ]),
        }),
      );
    });
  });

  describe("renameSchema", () => {
    it("executes an alter schema ... rename to statement", async () => {
      await createEnsDbWriter().renameSchema("from", "to");

      expect(executeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          queryChunks: expect.arrayContaining([
            expect.objectContaining({ value: ["alter schema "] }),
            expect.objectContaining({ value: [" rename to "] }),
          ]),
        }),
      );
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
