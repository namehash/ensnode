import type { Address } from "viem";
import { describe, expect, it } from "vitest";

import { deserializeAccountId } from "./deserialize";
import { serializeAccountId } from "./serialize";
import type { AccountId } from "./types";

const vitalikEthAddress: Address = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";

describe("ENSNode SDK Shared: AccountId", () => {
  it("can serialize AccountId object into a CAIP-10 formatted inline string", () => {
    expect(
      serializeAccountId({
        chainId: 1,
        address: vitalikEthAddress,
      }),
    ).toStrictEqual(`eip155:1:${vitalikEthAddress}`);
  });

  it("can deserialize SerializedAccountId string into an AccountId object", () => {
    expect(deserializeAccountId(`eip155:1:${vitalikEthAddress}`)).toStrictEqual({
      chainId: 1,
      address: vitalikEthAddress,
    } satisfies AccountId);
  });

  it("refuses to deserialize invalid string", () => {
    expect(() => deserializeAccountId(`eip155:-1:${vitalikEthAddress}`)).toThrowError(
      /The numeric value represented by Account ID chain ID must be a positive integer/i,
    );

    expect(() => deserializeAccountId(`eip155:1:0xz`)).toThrowError(
      /Account ID address must be a valid EVM address/i,
    );
  });
});
