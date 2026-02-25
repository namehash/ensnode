import { afterEach, describe, expect, it, vi } from "vitest";

import * as datasources from "@ensnode/datasources";
import { ENSNamespaceIds, PluginName } from "@ensnode/ensnode-sdk";

import * as plugins from "@/plugins";

import { buildChainsBlockrange } from "./chains-blockrange";

vi.mock("@ensnode/datasources", async () => {
  const actual =
    await vi.importActual<typeof import("@ensnode/datasources")>("@ensnode/datasources");

  return {
    ...actual,
    getENSNamespace: vi.fn(),
  };
});

vi.mock("@/plugins", () => ({
  getPlugin: vi.fn(),
}));

const getENSNamespaceMock = vi.mocked(datasources.getENSNamespace);
const getPluginMock = vi.mocked(plugins.getPlugin);
const ensNamespaceMock = (value: unknown) =>
  value as ReturnType<typeof datasources.getENSNamespace>;
const pluginMock = (value: unknown) => value as ReturnType<typeof plugins.getPlugin>;

describe("buildChainsBlockrange()", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("builds merged blockranges across plugins and datasources", () => {
    // Arrange
    getENSNamespaceMock.mockReturnValue(
      ensNamespaceMock({
        ensroot: {
          chain: { id: 1 },
          contracts: {
            registry: { startBlock: 100, endBlock: 200 },
            resolver: { startBlock: 80 },
          },
        },
        basenames: {
          chain: { id: 8453 },
          contracts: {
            registry: { startBlock: 5, endBlock: 260 },
          },
        },
        threeDnsBase: {
          chain: { id: 8453 },
          contracts: {
            registry: { startBlock: 120, endBlock: 250 },
          },
        },
      }),
    );

    getPluginMock
      .mockReturnValueOnce(
        pluginMock({
          requiredDatasourceNames: ["ensroot"],
        }),
      )
      .mockReturnValueOnce(
        pluginMock({
          requiredDatasourceNames: ["basenames"],
        }),
      )
      .mockReturnValueOnce(
        pluginMock({
          requiredDatasourceNames: ["threeDnsBase"],
        }),
      );

    // Act
    const result = buildChainsBlockrange(ENSNamespaceIds.Mainnet, [
      PluginName.Subgraph,
      PluginName.Basenames,
      PluginName.ThreeDNS,
    ]);

    // Assert
    expect(result).toStrictEqual(
      new Map([
        [1, { startBlock: 80, endBlock: 200 }],
        [8453, { startBlock: 5, endBlock: 260 }],
      ]),
    );
  });

  it("keeps endBlock undefined when no contracts define it", () => {
    // Arrange
    getENSNamespaceMock.mockReturnValue(
      ensNamespaceMock({
        ensroot: {
          chain: { id: 1 },
          contracts: {
            registry: { startBlock: 100 },
            resolver: { startBlock: 90 },
          },
        },
      }),
    );

    getPluginMock.mockReturnValue(
      pluginMock({
        requiredDatasourceNames: ["ensroot"],
      }),
    );

    // Act
    const result = buildChainsBlockrange(ENSNamespaceIds.Mainnet, [PluginName.Subgraph]);

    // Assert

    expect(result).toStrictEqual(new Map([[1, { startBlock: 90, endBlock: undefined }]]));
  });

  it("ignores missing datasources", () => {
    // Arrange
    getENSNamespaceMock.mockReturnValue(ensNamespaceMock({}));
    getPluginMock.mockReturnValue(
      pluginMock({
        requiredDatasourceNames: ["seaport"],
      }),
    );

    // Act
    const result = buildChainsBlockrange(ENSNamespaceIds.Mainnet, [PluginName.Subgraph]);

    // Assert
    expect(result.size).toBe(0);
  });
});
