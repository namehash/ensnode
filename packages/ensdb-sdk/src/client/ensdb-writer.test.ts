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

const onConflictDoUpdateMock = vi.fn(async () => undefined);
const valuesMock = vi.fn(() => ({ onConflictDoUpdate: onConflictDoUpdateMock }));
const insertMock = vi.fn(() => ({ values: valuesMock }));
const drizzleClientMock = { insert: insertMock } as any;

vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: vi.fn(() => drizzleClientMock),
}));
vi.mock("drizzle-orm/node-postgres/migrator", () => ({ migrate: vi.fn() }));

describe("EnsDbWriter", () => {
  const createEnsDbWriter = () =>
    new EnsDbWriter(ensDbClientMock.ensDbUrl, ensDbClientMock.ensIndexerSchemaName);

  beforeEach(() => {
    onConflictDoUpdateMock.mockClear();
    valuesMock.mockClear();
    insertMock.mockClear();
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

  describe("migrateEnsNodeSchema", () => {
    it("calls drizzle-orm migrate with the correct parameters", async () => {
      const migrationsDirPath = "/path/to/migrations";

      await createEnsDbWriter().migrateEnsNodeSchema(migrationsDirPath);

      expect(vi.mocked(migrate)).toHaveBeenCalledWith(drizzleClientMock, {
        migrationsFolder: migrationsDirPath,
        migrationsSchema: "ensnode",
      });
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
