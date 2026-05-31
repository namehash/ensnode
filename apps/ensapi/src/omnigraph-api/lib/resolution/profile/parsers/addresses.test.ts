import { describe, expect, it } from "vitest";

import { ADDRESS_PARSERS } from "./addresses";
import { profileRecordsModel } from "./test-helpers";

describe("ADDRESS_PARSERS", () => {
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
  ] as const)("parses %s address", (field, coinType, raw, expected) => {
    expect(ADDRESS_PARSERS[field].selection).toEqual({ addresses: [coinType] });
    expect(ADDRESS_PARSERS[field].parse(profileRecordsModel({}, { [coinType]: raw }))).toBe(
      expected,
    );
  });

  it.each([
    ["record unset", undefined],
    ["empty string", ""],
    ["0x sentinel", "0x"],
    ["non-hex value", "not-hex"],
  ] as const)("returns null: %s (%s)", (_message, raw) => {
    for (const [field, parser] of Object.entries(ADDRESS_PARSERS)) {
      const coinType = parser.selection.addresses?.[0];
      if (coinType == null) throw new Error(`Coin type not found for parser ${field}`);
      const model = raw === undefined ? {} : { [coinType]: raw };
      expect(parser.parse(profileRecordsModel({}, model))).toBeNull();
    }
  });
});
