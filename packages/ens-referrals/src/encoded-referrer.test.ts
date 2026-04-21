import { type Address, asNormalizedAddress, toNormalizedAddress } from "enssdk";
import { concat, getAddress, pad, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

import {
  buildEncodedReferrer,
  decodeReferrer,
  ENCODED_REFERRER_BYTE_LENGTH,
  ENCODED_REFERRER_BYTE_OFFSET,
} from "./encoded-referrer";

const vitalikEthAddressLowercase = asNormalizedAddress(
  "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
);

const vitalikEthAddressChecksummed: Address = getAddress(
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
);

describe("encoded referrer", () => {
  describe("decoding a 32-byte value", () => {
    it("returns the EVM address when initial bytes were all zeroes", () => {
      // arrange
      const input = pad(vitalikEthAddressLowercase);

      // act
      const result = decodeReferrer(input);

      // assert
      expect(result).toEqual(vitalikEthAddressLowercase);
    });

    it("returns a zeroAddress value when initial bytes were not all zeroes", () => {
      // arrange
      const initialBytes = pad("0x1", { size: ENCODED_REFERRER_BYTE_OFFSET, dir: "right" });

      const input = concat([initialBytes, vitalikEthAddressLowercase]);

      // act
      const result = decodeReferrer(input);
      // & assert
      expect(result).toStrictEqual(zeroAddress);
    });

    it("throws an error when trailing bytes were not referring a valid EVM address", () => {
      // arrange
      const input = pad("0xzzzzzzzzzzzzzzzzzzzz");

      // act & assert
      expect(() => decodeReferrer(input)).toThrowError(
        /Decoded referrer value must be a valid EVM address/i,
      );
    });
  });

  describe("decoding a non-32-byte value", () => {
    it("throws an error", () => {
      expect(() => decodeReferrer("0x")).toThrowError(
        /Encoded referrer value must be represented by 32 bytes/i,
      );
    });
  });

  describe("building encoded referrer", () => {
    it.each([
      { addressFormat: "lowercase", address: vitalikEthAddressLowercase },
      { addressFormat: "checksummed", address: vitalikEthAddressChecksummed },
    ])("returns encoded referrer for a $addressFormat EVM address", ({ address }) => {
      // encoding should operate as expected
      const expectedEncodedReferrer = pad(address.toLowerCase() as Address, {
        size: ENCODED_REFERRER_BYTE_LENGTH,
        dir: "left",
      });

      const encodedReferrer = buildEncodedReferrer(address);
      expect(encodedReferrer).toEqual(expectedEncodedReferrer);

      // decoding should operate as expected
      const expectedDecodedReferrer = toNormalizedAddress(address);
      const decodedReferrer = decodeReferrer(encodedReferrer);
      expect(decodedReferrer).toStrictEqual(expectedDecodedReferrer);
    });
  });

  it("throws an error when building encoded referrer with invalid EVM address", () => {
    expect(() => buildEncodedReferrer("0xnotavalidaddress" as Address)).toThrowError(
      /'0xnotavalidaddress' does not represent an EVM Address/i,
    );
  });
});
