import type { Address } from "viem";
import { describe, expect, it } from "vitest";

import { deserializeAccountId } from "./deserialize";
import { serializeAccountId } from "./serialize";
import type { AccountId } from "./types";

const vitalikEthAddressLowercase: Address = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
const vitalikEthAddressChecksummed: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

describe("ENSNode SDK Shared: AccountId", () => {
  it("can serialize AccountId object into a CAIP-10 formatted inline string", () => {
    expect(
      serializeAccountId({
        chainId: 1,
        address: vitalikEthAddressLowercase,
      }),
    ).toStrictEqual(`eip155:1:${vitalikEthAddressLowercase}`);

    expect(
      serializeAccountId({
        chainId: 1,
        address: vitalikEthAddressChecksummed,
      }),
    ).toStrictEqual(`eip155:1:${vitalikEthAddressLowercase}`);
  });

  it("can deserialize SerializedAccountId string into an AccountId object", () => {
    expect(deserializeAccountId(`eip155:1:${vitalikEthAddressLowercase}`)).toStrictEqual({
      chainId: 1,
      address: vitalikEthAddressLowercase,
    } satisfies AccountId);

    expect(deserializeAccountId(`eip155:1:${vitalikEthAddressChecksummed}`)).toStrictEqual({
      chainId: 1,
      address: vitalikEthAddressLowercase,
    } satisfies AccountId);
  });

  it("refuses to deserialize invalid string", () => {
    expect(() => deserializeAccountId(`eip155:-1:${vitalikEthAddressLowercase}`)).toThrowError(
      /Account ID chain ID must be a positive integer/i,
    );

    expect(() => deserializeAccountId(`eip155:1:0xz`)).toThrowError(
      /Account ID address must be a valid EVM address/i,
    );
  });
});
