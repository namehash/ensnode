import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  readDumpSchemaNameMock,
  restoreDumpMock,
  existsSyncMock,
  readFileSyncMock,
  migrateEnsNodeSchemaMock,
  schemaExistsMock,
  getEnsNodeMetadataMock,
  dropSchemaMock,
  renameSchemaMock,
  writeEnsNodeMetadataMock,
  destroyMock,
} = vi.hoisted(() => ({
  readDumpSchemaNameMock: vi.fn(async () => "dumpSchema" as string | undefined),
  restoreDumpMock: vi.fn(async () => undefined),
  existsSyncMock: vi.fn(() => true),
  readFileSyncMock: vi.fn(() => JSON.stringify({ key: "indexing_metadata_context", value: 1 })),
  migrateEnsNodeSchemaMock: vi.fn(async () => undefined),
  schemaExistsMock: vi.fn(async () => false),
  getEnsNodeMetadataMock: vi.fn(async () => undefined as unknown),
  dropSchemaMock: vi.fn(async () => undefined),
  renameSchemaMock: vi.fn(async () => undefined),
  writeEnsNodeMetadataMock: vi.fn(async () => undefined),
  destroyMock: vi.fn(async () => undefined),
}));

vi.mock("../lib/pgtools", () => ({
  readDumpSchemaName: readDumpSchemaNameMock,
  restoreDump: restoreDumpMock,
}));
vi.mock("../lib/migrations", () => ({ ensnodeMigrationsDir: () => "/migrations" }));
vi.mock("node:fs", () => ({
  existsSync: existsSyncMock,
  readFileSync: readFileSyncMock,
}));
vi.mock("@ensnode/ensdb-sdk", () => ({
  EnsNodeMetadataKeys: { IndexingMetadataContext: "indexing_metadata_context" },
  EnsDbWriter: class {
    migrateEnsNodeSchema = migrateEnsNodeSchemaMock;
    schemaExists = schemaExistsMock;
    getEnsNodeMetadata = getEnsNodeMetadataMock;
    dropSchema = dropSchemaMock;
    renameSchema = renameSchemaMock;
    writeEnsNodeMetadata = writeEnsNodeMetadataMock;
    destroy = destroyMock;
  },
}));

import { load } from "./load";

const baseArgs = {
  dump: "/tmp/x.dump",
  into: "postgres://into/db",
  schema: "targetSchema",
  force: false,
};

describe("load command", () => {
  beforeEach(() => {
    readDumpSchemaNameMock.mockResolvedValue("dumpSchema");
    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue(
      JSON.stringify({ key: "indexing_metadata_context", value: 1 }),
    );
    schemaExistsMock.mockResolvedValue(false);
    getEnsNodeMetadataMock.mockResolvedValue(undefined);
    for (const m of [
      migrateEnsNodeSchemaMock,
      dropSchemaMock,
      renameSchemaMock,
      writeEnsNodeMetadataMock,
      restoreDumpMock,
      destroyMock,
    ]) {
      m.mockClear();
    }
  });

  it("requires --schema and --into; --force defaults to false; --skip-if-exists is gone", () => {
    expect((load.args as any).schema).toMatchObject({ type: "string", required: true });
    expect((load.args as any).into).toMatchObject({ type: "string", required: true });
    expect((load.args as any).force).toMatchObject({ type: "boolean", default: false });
    expect((load.args as any)["skip-if-exists"]).toBeUndefined();
    expect((load.args as any).metadata).toBeUndefined();
  });

  it("fails fast when the dump's schema name cannot be resolved (Greptile P1)", async () => {
    readDumpSchemaNameMock.mockResolvedValueOnce(undefined);

    await expect(load.run!({ args: { ...baseArgs } } as any)).rejects.toThrow(
      /could not determine the dump's schema name/,
    );
    expect(restoreDumpMock).not.toHaveBeenCalled();
  });

  it("errors clearly when the metadata sidecar is missing", async () => {
    existsSyncMock.mockReturnValueOnce(false);

    await expect(load.run!({ args: { ...baseArgs } } as any)).rejects.toThrow(
      /metadata sidecar not found/,
    );
  });

  it("migrates the ensnode schema before restoring", async () => {
    await load.run!({ args: { ...baseArgs } } as any);

    expect(migrateEnsNodeSchemaMock).toHaveBeenCalledWith("/migrations");
    const migrateOrder = migrateEnsNodeSchemaMock.mock.invocationCallOrder[0]!;
    const restoreOrder = restoreDumpMock.mock.invocationCallOrder[0]!;
    expect(migrateOrder).toBeLessThan(restoreOrder);
  });

  it("restores, renames to the target schema, and upserts metadata", async () => {
    await load.run!({ args: { ...baseArgs } } as any);

    expect(dropSchemaMock).toHaveBeenCalledWith("dumpSchema");
    expect(restoreDumpMock).toHaveBeenCalledWith("postgres://into/db", "/tmp/x.dump");
    expect(renameSchemaMock).toHaveBeenCalledWith("dumpSchema", "targetSchema");
    expect(writeEnsNodeMetadataMock).toHaveBeenCalledWith({
      key: "indexing_metadata_context",
      value: 1,
    });
  });

  it("fails fast (no --force) when the target schema already exists", async () => {
    schemaExistsMock.mockResolvedValueOnce(true);

    await expect(load.run!({ args: { ...baseArgs } } as any)).rejects.toThrow(
      /schema "targetSchema" .*already exist.*--force/,
    );
    expect(restoreDumpMock).not.toHaveBeenCalled();
  });

  it("fails fast (no --force) when the target metadata entry already exists", async () => {
    getEnsNodeMetadataMock.mockResolvedValueOnce({ key: "indexing_metadata_context", value: 1 });

    await expect(load.run!({ args: { ...baseArgs } } as any)).rejects.toThrow(
      /ENSNode metadata entry for "targetSchema" .*already exist.*--force/,
    );
  });

  it("--force overwrites an existing schema and metadata", async () => {
    schemaExistsMock.mockResolvedValueOnce(true);
    getEnsNodeMetadataMock.mockResolvedValueOnce({ key: "indexing_metadata_context", value: 1 });

    await load.run!({ args: { ...baseArgs, force: true } } as any);

    expect(restoreDumpMock).toHaveBeenCalled();
    expect(renameSchemaMock).toHaveBeenCalledWith("dumpSchema", "targetSchema");
    expect(writeEnsNodeMetadataMock).toHaveBeenCalled();
  });

  it("does not rename when the dump schema already matches the target", async () => {
    readDumpSchemaNameMock.mockResolvedValueOnce("targetSchema");

    await load.run!({ args: { ...baseArgs } } as any);

    expect(renameSchemaMock).not.toHaveBeenCalled();
  });
});
