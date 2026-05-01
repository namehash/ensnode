import type { AccountId, Address } from "enssdk";
import { stringifyAccountId } from "enssdk";
import { describe, expect, it } from "vitest";

import { parseAccountId } from "./deserialize";
import { makeAccountIdStringSchema } from "./zod-schemas";

const vitalikEthAddressLowercase: Address = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
const vitalikEthAddressChecksummed: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

describe("ENSNode SDK Shared: AccountId", () => {
  it("can serialize AccountId object into a CAIP-10 formatted inline string", () => {
    expect(
      stringifyAccountId({
        chainId: 1,
        address: vitalikEthAddressLowercase,
      }),
    ).toStrictEqual(`eip155:1:${vitalikEthAddressLowercase}`);

    expect(
      stringifyAccountId({
        chainId: 1,
        address: vitalikEthAddressChecksummed,
      }),
    ).toStrictEqual(`eip155:1:${vitalikEthAddressLowercase}`);
  });

  it("can parse AccountIdString string into an AccountId object", () => {
    expect(parseAccountId(`eip155:1:${vitalikEthAddressLowercase}`)).toStrictEqual({
      chainId: 1,
      address: vitalikEthAddressLowercase,
    } satisfies AccountId);

    expect(parseAccountId(`eip155:1:${vitalikEthAddressChecksummed}`)).toStrictEqual({
      chainId: 1,
      address: vitalikEthAddressLowercase,
    } satisfies AccountId);
  });

  it("refuses to deserialize invalid string", () => {
    expect(() => parseAccountId(`eip155:-1:${vitalikEthAddressLowercase}`)).toThrowError(
      /Account ID String chain ID must be a positive integer/i,
    );

    expect(() => parseAccountId(`eip155:1:0xz`)).toThrowError(
      /Account ID String address must be a valid EVM address/i,
    );
  });

  describe("makeAccountIdStringSchema safeParse never throws", () => {
    const schema = makeAccountIdStringSchema();

    it("returns a Zod issue (not a thrown Error) for completely malformed strings", () => {
      const result = schema.safeParse("not-a-caip-10-string");
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toMatch(/invalid CAIP-10 AccountId string/i);
    });

    it("returns a Zod issue (not a thrown Error) when probed with undefined", () => {
      const result = schema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it("parseAccountId surfaces invalid CAIP-10 strings as a clean RangeError", () => {
      expect(() => parseAccountId("not-a-caip-10-string")).toThrowError(
        /invalid CAIP-10 AccountId string/i,
      );
    });
  });
});
