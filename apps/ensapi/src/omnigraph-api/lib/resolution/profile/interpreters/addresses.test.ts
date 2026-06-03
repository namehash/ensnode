import type { Hex } from "viem";
import { describe, expect, it } from "vitest";

import { ADDRESS_INTERPRETERS } from "./addresses";
import { profileRecordsModel } from "./test-helpers";

describe("ADDRESS_INTERPRETERS", () => {
  it.each([
    [
      "ethereum",
      60,
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    ],
    [
      "base",
      2147492101,
      "0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045",
      "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    ],
    [
      "bitcoin",
      0,
      "0x76a91462e907b15cbf27d5425399ebf6f0fb50ebb88f1888ac",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    ],
    [
      "solana",
      501,
      "0x8a11e71b96cabbe3216e3153b09694f39fc85022cbc076f79846a3ab4d8c1991",
      "AHy6YZA8BsHgQfVkk7MbwpAN94iyN7Nf1zN4nPqUN32Q",
    ],
    // ENSIP-9 test vectors
    [
      "litecoin",
      2,
      "0x76a914a5f4d12ce3685781b227c1f39548ddef429e978388ac",
      "LaMT348PWRnrqeeWArpwQPbuanpXDZGEUz",
    ],
    [
      "dogecoin",
      3,
      "0x76a9144620b70031f0e9437e374a2100934fba4911046088ac",
      "DBXu2kgc3xtvCUWFcxFE3r9hEYgmuaaCyD",
    ],
    [
      "monacoin",
      22,
      "0x76a9146e5bb7226a337fe8307b4192ae5c3fab9fa9edf588ac",
      "MHxgS2XMXjeJ4if2PRRbWYcdwZPWfdwaDT",
    ],
    [
      "rootstock",
      137,
      "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed",
      "0x5aaEB6053f3e94c9b9a09f33669435E7ef1bEAeD",
    ],
    [
      "ripple",
      144,
      "0x004b4e9c06f24296074f7bc48f92a97916c6dc5ea9",
      "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
    ],
    [
      "bitcoincash",
      145,
      "0x76a91476a04053bda0a88bda5177b86a15c3b29f55987388ac",
      "bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a",
    ],
    [
      "binance",
      714,
      "0x40c2979694bbc961023d1d27be6fc4d21a9febe6",
      "bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2",
    ],
  ] as const)("parses %s address", (field, coinType, raw, expected) => {
    expect(ADDRESS_INTERPRETERS[field].selection).toEqual({ addresses: [coinType] });
    expect(
      ADDRESS_INTERPRETERS[field].interpret(profileRecordsModel({}, { [coinType]: raw })),
    ).toBe(expected);
  });

  it.each([
    ["record unset", undefined],
    ["empty string", ""],
    ["0x sentinel", "0x"],
    ["non-hex value", "0xnot-hex"],
  ] as const)("returns null: %s (%s)", (_message, raw) => {
    for (const [field, interpreter] of Object.entries(ADDRESS_INTERPRETERS)) {
      const coinType = interpreter.selection.addresses?.[0];
      if (coinType == null) throw new Error(`Coin type not found for interpreter ${field}`);
      const model = raw === undefined ? {} : { [coinType]: raw as Hex };
      expect(interpreter.interpret(profileRecordsModel({}, model))).toBeNull();
    }
  });
});
