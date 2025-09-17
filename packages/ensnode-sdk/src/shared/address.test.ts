import { describe, expect, it } from "vitest";
import { asLowerCaseAddress } from "./address";

describe("asLowerCaseAddress", () => {
  it("should convert a valid EVM address to lowercase", () => {
    // arrange
    const input = "0x6bD421B6e762d6AD89780EB54B9255f9ab5840BF";

    // act
    const result = asLowerCaseAddress(input);

    // assert
    expect(result).toBe("0x6bd421b6e762d6ad89780eb54b9255f9ab5840bf");
  });

  it("should throw an error for an invalid EVM address", () => {
    // arrange
    const input = "0xinvalid";

    // act & assert
    expect(() => asLowerCaseAddress(input)).toThrowError(
      `Cannot make an invalid EVM address "${input}" lowercase.`,
    );
  });
});
