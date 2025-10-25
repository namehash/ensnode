import { Address, bytesToHex, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";
import { interpretRawReferrer } from "./helpers";

const vitalikEthAddress: Address = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";

describe("raw referrer", () => {
  describe("interpreting a 32-byte value", () => {
    it("returns the EVM address when initial bytes were all zeroes", () => {
      // arrange
      const initialBytes = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

      const remainingBytes = new Uint8Array([
        216, 218, 107, 242, 105, 100, 175, 157, 126, 237, 158, 3, 229, 52, 21, 211, 122, 169, 96,
        69,
      ]);

      const input = bytesToHex(new Uint8Array([...initialBytes, ...remainingBytes]));

      // act
      const result = interpretRawReferrer(input);

      // assert
      expect(result).toEqual(vitalikEthAddress);
    });

    it("returns a zero address when initial bytes were not all zeroes", () => {
      // arrange
      const initialBytes = new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

      const remainingBytes = new Uint8Array([
        216, 218, 107, 242, 105, 100, 175, 157, 126, 237, 158, 3, 229, 52, 21, 211, 122, 169, 96,
        69,
      ]);

      const input = bytesToHex(new Uint8Array([...initialBytes, ...remainingBytes]));

      // act
      const result = interpretRawReferrer(input);

      // assert
      expect(result).toEqual(zeroAddress);
    });
  });
});
