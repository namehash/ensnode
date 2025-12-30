import { namehash, zeroAddress } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DatasourceNames } from "@ensnode/datasources";
import { type AccountId, ENSNamespaceIds, getDatasourceContract } from "@ensnode/ensnode-sdk";

import { getManagedName } from "./managed-names";

const { spy } = vi.hoisted(() => {
  return { spy: vi.fn() };
});

vi.mock("viem", async () => {
  const actual = await vi.importActual<typeof import("viem")>("viem");
  return {
    ...actual,
    namehash: (name: string) => {
      spy(name);
      return actual.namehash(name);
    },
  };
});

// mock config.namespace as mainnet
vi.mock("@/config", () => ({ default: { namespace: ENSNamespaceIds.Mainnet } }));

const registrar = getDatasourceContract(
  ENSNamespaceIds.Mainnet,
  DatasourceNames.ENSRoot,
  "BaseRegistrar",
);

const controller = getDatasourceContract(
  ENSNamespaceIds.Mainnet,
  DatasourceNames.ENSRoot,
  "LegacyEthRegistrarController",
);

const ETH_NODE = namehash("eth");

describe("managed-names", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // NOTE: because the cache isn't resettable between test runs (exporting a reset method isn't worth),
  // we simply enforce that the cache test case be run first via .sequential
  describe.sequential("getManagedName", () => {
    it("should cache the result of viem#namehash", () => {
      expect(spy.mock.calls).toHaveLength(0);

      expect(getManagedName(registrar)).toStrictEqual({ name: "eth", node: ETH_NODE });

      // first call should invoke namehash
      expect(spy.mock.calls).toHaveLength(1);

      expect(getManagedName(controller)).toStrictEqual({ name: "eth", node: ETH_NODE });

      // second call should not invoke namehash
      expect(spy.mock.calls).toHaveLength(1);
    });

    it("should return the managed name and node for the BaseRegistrar contract", () => {
      expect(getManagedName(registrar)).toStrictEqual({ name: "eth", node: ETH_NODE });
    });

    it("should throw an error for a contract without a managed name", () => {
      const unknownContract: AccountId = { chainId: 1, address: zeroAddress };
      expect(() => getManagedName(unknownContract)).toThrow();
    });
  });
});
