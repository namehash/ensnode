import { describe, expect, it } from "vitest";

import { mergePonderConfigs } from "@/lib/merge-ponder-configs";

describe("mergePonderConfigs", () => {
  it("should deeply merge two objects", () => {
    const target = { a: 1, b: { c: 2 } };
    const source = { b: { d: 3 }, e: 4 };
    expect(mergePonderConfigs(target, source)).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
  });

  it("should de-duplicate abis instead of concatenating them", () => {
    const EXAMPLE_ABI_ITEM = {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "node",
          type: "bytes32",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "contentType",
          type: "uint256",
        },
      ],
      name: "ABIChanged",
      type: "event",
    };
    const target = { abi: [EXAMPLE_ABI_ITEM], array: [{ key: "a" }] };
    const source = { abi: [EXAMPLE_ABI_ITEM], array: [{ key: "a" }, { key: "b" }] };
    expect(mergePonderConfigs(target, source)).toEqual({
      abi: [EXAMPLE_ABI_ITEM], // de-duped
      array: [{ key: "a" }, { key: "a" }, { key: "b" }], // concatenated
    });
  });
});

it("should use the minimum startBlock and maxium endBlock for Resolver contracts", () => {
  const target = {
    contracts: { Resolver: { network: { "1": { startBlock: 1, endBlock: 1 } } } },
  };
  const source = {
    contracts: { Resolver: { network: { "1": { startBlock: 2, endBlock: 2 } } } },
  };
  expect(mergePonderConfigs(target, source)).toEqual({
    contracts: {
      Resolver: {
        network: {
          "1": {
            startBlock: 1,
            endBlock: 2,
          },
        },
      },
    },
  });
});
