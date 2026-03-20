import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deserializeCrossChainIndexingStatusSnapshot,
  serializeEnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import * as ensIndexerSchema from "../ensindexer-abstract";
import * as ensNodeSchema from "../ensnode";
import * as ensDbClientMock from "./ensdb-client.mock";
import { EnsDbReader } from "./ensdb-reader";

const ensIndexerSchemaMock = ensIndexerSchema as any;
const ensNodeSchemaMock = ensNodeSchema as any;

describe("EnsDbReader", () => {
  const selectResult = { current: [] as Array<{ value: unknown }> };
  const whereMock = vi.fn(async () => selectResult.current);
  const fromMock = vi.fn(() => ({ where: whereMock }));
  const selectMock = vi.fn(() => ({ from: fromMock }));
  const drizzleClientMock = { select: selectMock } as any;

  const createEnsDbReader = () =>
    new EnsDbReader(
      drizzleClientMock,
      ensIndexerSchemaMock,
      ensDbClientMock.ensIndexerSchemaName,
      ensNodeSchemaMock,
    );

  beforeEach(() => {
    selectResult.current = [];
    whereMock.mockClear();
    fromMock.mockClear();
    selectMock.mockClear();
  });

  describe("getEnsDbVersion", () => {
    it("returns undefined when no record exists", async () => {
      await expect(createEnsDbReader().getEnsDbVersion()).resolves.toBeUndefined();

      expect(selectMock).toHaveBeenCalledTimes(1);
      expect(fromMock).toHaveBeenCalledWith(ensNodeSchemaMock.metadata);
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
});
