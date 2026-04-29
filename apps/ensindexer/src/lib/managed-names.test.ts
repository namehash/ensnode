import { type AccountId, ETH_NODE } from "enssdk";
import { zeroAddress } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DatasourceNames } from "@ensnode/datasources";
import { ENSNamespaceIds, getDatasourceContract } from "@ensnode/ensnode-sdk";

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

const ensv1Registry = getDatasourceContract(
  ENSNamespaceIds.Mainnet,
  DatasourceNames.ENSRoot,
  "ENSv1Registry",
);

describe("managed-names", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // NOTE: because the cache isn't resettable between test runs (exporting a reset method isn't worth),
  // we simply enforce that the cache test case be run first via .sequential
  describe.sequential("getManagedName", () => {
    it("should memoize per (namespace, contract)", () => {
      expect(spy.mock.calls).toHaveLength(0);

      expect(getManagedName(registrar)).toMatchObject({ name: "eth", node: ETH_NODE });

      // first call should invoke namehash
      expect(spy.mock.calls).toHaveLength(1);

      // repeat call for the same contract is served from cache
      expect(getManagedName(registrar)).toMatchObject({ name: "eth", node: ETH_NODE });
      expect(spy.mock.calls).toHaveLength(1);
    });

    it("should return the managed name, node, and registry for the BaseRegistrar contract", () => {
      expect(getManagedName(registrar)).toStrictEqual({
        name: "eth",
        node: ETH_NODE,
        registry: ensv1Registry,
      });
    });

    it("should throw an error for a contract without a managed name", () => {
      const unknownContract: AccountId = { chainId: 1, address: zeroAddress };
      expect(() => getManagedName(unknownContract)).toThrow();
    });
  });
});
