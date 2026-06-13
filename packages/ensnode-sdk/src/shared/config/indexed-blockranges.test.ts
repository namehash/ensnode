import type { ChainId } from "enssdk";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as datasources from "@ensnode/datasources";
import { type DatasourceName, DatasourceNames, ENSNamespaceIds } from "@ensnode/datasources";

import { PluginName } from "../../ensindexer/config/types";
import { type BlockNumberRangeWithStartBlock, buildBlockNumberRange } from "../blockrange";
import { buildIndexedBlockranges } from "./indexed-blockranges";

vi.mock("@ensnode/datasources", async () => {
  const actual =
    await vi.importActual<typeof import("@ensnode/datasources")>("@ensnode/datasources");

  return {
    ...actual,
    maybeGetDatasource: vi.fn(),
  };
});

const maybeGetDatasourceMock = vi.mocked(datasources.maybeGetDatasource);
const datasourceMock = (value: unknown) =>
  value as ReturnType<typeof datasources.maybeGetDatasource>;

describe("buildIndexedBlockranges()", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("builds merged blockranges across plugins and datasources", () => {
    // Arrange
    const ensrootDatasourceConfig: unknown = {
      chain: { id: 1 },
      contracts: {
        registry: { startBlock: 100, endBlock: 200 },
        resolver: { startBlock: 80 },
      },
    };
    const basenamesDatasourceConfig: unknown = {
      chain: { id: 8453 },
      contracts: {
        registry: { startBlock: 5, endBlock: 260 },
      },
    };
    const threeDnsBaseDatasourceConfig: unknown = {
      chain: { id: 8453 },
      contracts: {
        registry: { startBlock: 120, endBlock: 250 },
      },
    };

    const datasourcesByName: Partial<
      Record<DatasourceName, ReturnType<typeof datasources.maybeGetDatasource>>
    > = {
      [DatasourceNames.ENSRoot]: datasourceMock(ensrootDatasourceConfig),
      [DatasourceNames.Basenames]: datasourceMock(basenamesDatasourceConfig),
      [DatasourceNames.ThreeDNSBase]: datasourceMock(threeDnsBaseDatasourceConfig),
    };

    maybeGetDatasourceMock.mockImplementation(
      (_namespace, datasourceName) => datasourcesByName[datasourceName as DatasourceName],
    );

    const pluginsRequiredDatasourceNames = new Map([
      [PluginName.Subgraph, [DatasourceNames.ENSRoot]],
      [PluginName.Basenames, [DatasourceNames.Basenames]],
      [PluginName.ThreeDNS, [DatasourceNames.ThreeDNSBase]],
    ]);

    // Act
    const result = buildIndexedBlockranges(
      ENSNamespaceIds.Mainnet,
      new Map(),
      pluginsRequiredDatasourceNames,
    );

    const expectedEntries = new Map<ChainId, BlockNumberRangeWithStartBlock>([
      [1, buildBlockNumberRange(80, undefined)],
      [8453, buildBlockNumberRange(5, 260)],
    ]);

    // Assert
    expect(result).toStrictEqual(expectedEntries);
  });

  it("keeps endBlock undefined when no contracts define it", () => {
    // Arrange
    const ensrootDatasourceConfig: unknown = {
      chain: { id: 1 },
      contracts: {
        registry: { startBlock: 100 },
        resolver: { startBlock: 90 },
      },
    };

    const datasourcesByName: Partial<
      Record<DatasourceName, ReturnType<typeof datasources.maybeGetDatasource>>
    > = {
      [DatasourceNames.ENSRoot]: datasourceMock(ensrootDatasourceConfig),
    };

    maybeGetDatasourceMock.mockImplementation(
      (_namespace, datasourceName) => datasourcesByName[datasourceName as DatasourceName],
    );

    const pluginsRequiredDatasourceNames = new Map([
      [PluginName.Subgraph, [DatasourceNames.ENSRoot]],
    ]);

    // Act
    const result = buildIndexedBlockranges(
      ENSNamespaceIds.Mainnet,
      new Map(),
      pluginsRequiredDatasourceNames,
    );

    // Assert

    expect(result).toStrictEqual(new Map([[1, buildBlockNumberRange(90, undefined)]]));
  });

  it("keeps endBlock undefined when only some contracts define it", () => {
    // Arrange
    const basenamesDatasourceConfig: unknown = {
      chain: { id: 8453 },
      contracts: {
        registry: { startBlock: 17571480 },
        reverseRegistrar: { startBlock: 18619035, endBlock: 35936564 },
        registrarController: { startBlock: 17575714 },
      },
    };

    const datasourcesByName: Partial<
      Record<DatasourceName, ReturnType<typeof datasources.maybeGetDatasource>>
    > = {
      [DatasourceNames.Basenames]: datasourceMock(basenamesDatasourceConfig),
    };

    maybeGetDatasourceMock.mockImplementation(
      (_namespace, datasourceName) => datasourcesByName[datasourceName as DatasourceName],
    );

    const pluginsRequiredDatasourceNames = new Map([
      [PluginName.Basenames, [DatasourceNames.Basenames]],
    ]);

    // Act
    const result = buildIndexedBlockranges(
      ENSNamespaceIds.Mainnet,
      new Map(),
      pluginsRequiredDatasourceNames,
    );

    // Assert
    expect(result).toStrictEqual(new Map([[8453, buildBlockNumberRange(17571480, undefined)]]));
  });

  it("skips datasources that do not exist in the namespace", () => {
    // Arrange
    maybeGetDatasourceMock.mockReturnValue(undefined);

    const pluginsDatasourceNames = new Map([[PluginName.Subgraph, [DatasourceNames.Seaport]]]);

    // Act
    const result = buildIndexedBlockranges(
      ENSNamespaceIds.Mainnet,
      new Map(),
      pluginsDatasourceNames,
    );

    // Assert
    expect(result).toStrictEqual(new Map());
  });

  it("applies per-chain end block to contracts without end block and skips contracts starting after the chain end block", () => {
    // Arrange
    const ensrootDatasourceConfig: unknown = {
      chain: { id: 1 },
      contracts: {
        registry: { startBlock: 100 }, // no endBlock, should use chain end block (500)
        resolver: { startBlock: 80, endBlock: 200 }, // has endBlock, should keep it
        registrar: { startBlock: 600 }, // startBlock > chain end block, should be skipped
      },
    };

    const basenamesDatasourceConfig: unknown = {
      chain: { id: 8453 },
      contracts: {
        registry: { startBlock: 5 }, // no endBlock, should use chain end block (500)
      },
    };

    const datasourcesByName: Partial<
      Record<DatasourceName, ReturnType<typeof datasources.maybeGetDatasource>>
    > = {
      [DatasourceNames.ENSRoot]: datasourceMock(ensrootDatasourceConfig),
      [DatasourceNames.Basenames]: datasourceMock(basenamesDatasourceConfig),
    };

    maybeGetDatasourceMock.mockImplementation(
      (_namespace, datasourceName) => datasourcesByName[datasourceName as DatasourceName],
    );

    const pluginsRequiredDatasourceNames = new Map([
      [PluginName.Subgraph, [DatasourceNames.ENSRoot]],
      [PluginName.Basenames, [DatasourceNames.Basenames]],
    ]);

    const chainEndBlocks = new Map<ChainId, number>([
      [1, 500],
      [8453, 500],
    ]);

    // Act
    const result = buildIndexedBlockranges(
      ENSNamespaceIds.Mainnet,
      chainEndBlocks,
      pluginsRequiredDatasourceNames,
    );

    // Assert
    const expectedEntries = new Map<ChainId, BlockNumberRangeWithStartBlock>([
      // Chain 1: min startBlock = 80, max endBlock = max(500 from registry, 200 from resolver) = 500
      [1, buildBlockNumberRange(80, 500)],
      // Chain 8453: startBlock = 5, endBlock = 500 (from chain end block)
      [8453, buildBlockNumberRange(5, 500)],
    ]);

    expect(result).toStrictEqual(expectedEntries);
  });
});
