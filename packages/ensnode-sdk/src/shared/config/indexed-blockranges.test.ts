import type { ChainId } from "enssdk";
import { afterEach, describe, expect, it, vi } from "vitest";
import { zeroAddress } from "viem";

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
    const result = buildIndexedBlockranges(ENSNamespaceIds.Mainnet, pluginsRequiredDatasourceNames);

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
    const result = buildIndexedBlockranges(ENSNamespaceIds.Mainnet, pluginsRequiredDatasourceNames);

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
    const result = buildIndexedBlockranges(ENSNamespaceIds.Mainnet, pluginsRequiredDatasourceNames);

    // Assert
    expect(result).toStrictEqual(new Map([[8453, buildBlockNumberRange(17571480, undefined)]]));
  });

  it("skips datasources that do not exist in the namespace", () => {
    // Arrange
    maybeGetDatasourceMock.mockReturnValue(undefined);

    const pluginsDatasourceNames = new Map([[PluginName.Subgraph, [DatasourceNames.Seaport]]]);

    // Act
    const result = buildIndexedBlockranges(ENSNamespaceIds.Mainnet, pluginsDatasourceNames);

    // Assert
    expect(result).toStrictEqual(new Map());
  });

  it("skips zero-address placeholder contracts", () => {
    // Arrange
    // Mirrors the sepolia-v2 shape where some plugin-required contracts are
    // present only to satisfy the typesystem and carry address: zeroAddress,
    // startBlock: 0. The merged blockrange should be derived from the real
    // contracts on the same chain only, not be dragged down to startBlock 0.
    const ensrootDatasourceConfig: unknown = {
      chain: { id: 1 },
      contracts: {
        registry: { address: "0x0000000000000000000000000000000000000001", startBlock: 100 },
        placeholder: { address: zeroAddress, startBlock: 0 },
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
    const result = buildIndexedBlockranges(ENSNamespaceIds.Mainnet, pluginsRequiredDatasourceNames);

    // Assert
    expect(result).toStrictEqual(new Map([[1, buildBlockNumberRange(100, undefined)]]));
  });
});
