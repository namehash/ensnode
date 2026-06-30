import { describe, expect, it, vi } from "vitest";

const { dumpSchemaMock, writeFileSyncMock, schemaExistsMock, getEnsNodeMetadataMock, destroyMock } =
  vi.hoisted(() => ({
    dumpSchemaMock: vi.fn(async () => undefined),
    writeFileSyncMock: vi.fn(),
    schemaExistsMock: vi.fn(async () => true),
    getEnsNodeMetadataMock: vi.fn(async () => ({ key: "indexing_metadata_context", value: 1 })),
    destroyMock: vi.fn(async () => undefined),
  }));

vi.mock("../lib/pgtools", () => ({ dumpSchema: dumpSchemaMock }));
vi.mock("node:fs", () => ({ writeFileSync: writeFileSyncMock }));
vi.mock("@ensnode/ensdb-sdk", () => ({
  EnsNodeMetadataKeys: { IndexingMetadataContext: "indexing_metadata_context" },
  EnsDbReader: class {
    schemaExists = schemaExistsMock;
    getEnsNodeMetadata = getEnsNodeMetadataMock;
    destroy = destroyMock;
  },
}));

import { dump, metadataSidecarPath } from "./dump";

describe("metadataSidecarPath", () => {
  it("appends .metadata.json to the dump path", () => {
    expect(metadataSidecarPath("/tmp/x.dump")).toBe("/tmp/x.dump.metadata.json");
  });
});

describe("dump command", () => {
  it("takes the schema name as a positional arg named ensIndexerSchemaName", () => {
    expect((dump.args as any).ensIndexerSchemaName).toMatchObject({
      type: "positional",
      required: true,
    });
  });

  it("has no --metadata-out option (metadata is always written)", () => {
    expect((dump.args as any)["metadata-out"]).toBeUndefined();
  });

  it("always writes the metadata sidecar next to the dump", async () => {
    writeFileSyncMock.mockClear();
    schemaExistsMock.mockResolvedValueOnce(true);
    getEnsNodeMetadataMock.mockResolvedValueOnce({ key: "indexing_metadata_context", value: 1 });

    await dump.run!({
      args: {
        ensIndexerSchemaName: "alphaSchema1.16.0",
        from: "postgres://x/y",
        out: "/tmp/o.dump",
      },
    } as any);

    expect(dumpSchemaMock).toHaveBeenCalledWith(
      "alphaSchema1.16.0",
      "postgres://x/y",
      "/tmp/o.dump",
    );
    expect(writeFileSyncMock).toHaveBeenCalledWith(
      "/tmp/o.dump.metadata.json",
      JSON.stringify({ key: "indexing_metadata_context", value: 1 }, null, 2),
    );
  });

  it("writes a null sidecar when no metadata record exists", async () => {
    writeFileSyncMock.mockClear();
    schemaExistsMock.mockResolvedValueOnce(true);
    getEnsNodeMetadataMock.mockResolvedValueOnce(undefined as any);

    await dump.run!({
      args: { ensIndexerSchemaName: "s", from: "postgres://x/y", out: "/tmp/o.dump" },
    } as any);

    expect(writeFileSyncMock).toHaveBeenCalledWith("/tmp/o.dump.metadata.json", "null");
  });
});
