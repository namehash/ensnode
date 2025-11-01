import { type Address, concat, getAddress, pad, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

import {
  buildEncodedReferrer,
  buildEnsReferralUrl,
  decodeEncodedReferrer,
  ENCODED_REFERRER_BYTE_LENGTH,
  ENCODED_REFERRER_BYTE_OFFSET,
} from "./referrer";

const vitalikEthAddressLowercase: Address = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
const vitalikEthAddressChecksummed: Address = getAddress(
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
);

describe("encoded referrer", () => {
  describe("decoding a 32-byte value", () => {
    it("returns the EVM address when initial bytes were all zeroes", () => {
      // arrange
      const input = pad(vitalikEthAddressLowercase);

      // act
      const result = decodeEncodedReferrer(input);

      // assert
      expect(result).toEqual(vitalikEthAddressChecksummed);
    });

    it("returns a zero address when initial bytes were not all zeroes", () => {
      // arrange
      const initialBytes = pad("0x1", { size: ENCODED_REFERRER_BYTE_OFFSET, dir: "right" });

      const input = concat([initialBytes, vitalikEthAddressLowercase]);

      // act
      const result = decodeEncodedReferrer(input);

      // assert
      expect(result).toEqual(zeroAddress);
    });
  });

  describe("decoding a non-32-byte value", () => {
    it("returns a zero address", () => {
      expect(decodeEncodedReferrer("0x")).toEqual(zeroAddress);
    });
  });

  describe("building encoded referrer", () => {
    it.each([
      { addressFormat: "lowercase", address: vitalikEthAddressLowercase },
      { addressFormat: "checksummed", address: vitalikEthAddressChecksummed },
    ])("returns encoded referrer for a $addressFormat EVM address", ({ address }) => {
      const expectedEncodedReferrer = pad(address.toLowerCase() as Address, {
        size: ENCODED_REFERRER_BYTE_LENGTH,
        dir: "left",
      }); // all lowercase hex
      const expectedDecodedReferrer = getAddress(address); // checksummed EVM address

      const encodedReferrer = buildEncodedReferrer(address);
      const decodedReferrer = decodeEncodedReferrer(encodedReferrer);

      expect(decodedReferrer).toStrictEqual(expectedDecodedReferrer);
      expect(encodedReferrer).toEqual(expectedEncodedReferrer);
    });
  });

  describe("building a referrer URL", () => {
    it("can build a referrer URL to ENS App", () => {
      const expectedUrlString = `https://app.ens.domains/?referrer=${vitalikEthAddressChecksummed}`;
      expect(buildEnsReferralUrl(vitalikEthAddressLowercase).toString()).toStrictEqual(
        expectedUrlString,
      );

      expect(buildEnsReferralUrl(vitalikEthAddressChecksummed).toString()).toStrictEqual(
        expectedUrlString,
      );
    });
  });
});
