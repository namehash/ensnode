import { toLatestRegistration } from "@/components/recent-registrations/hooks";
import {
  type LatestRegistration,
  type LatestRegistrationResult,
} from "@/components/recent-registrations/types";
import { describe, expect, it } from "vitest";

describe("toLatestRegistration function", () => {
  const latestRegistrationResultWithWrappedOwner: LatestRegistrationResult = {
    name: "onchainisland.eth",
    createdAt: "1748259983",
    expiryDate: "1850730383",
    owner: {
      id: "0xa53cca02f98d590819141aa85c891e2af713c223",
    },
    wrappedOwner: {
      id: "0xc79299f883a6d9dee407108a1dee35f99d5ca306",
    },
  };
  const latestRegistrationResultWithoutWrappedOwner: LatestRegistrationResult = {
    name: "empireofthesun.eth",
    createdAt: "1644045472",
    expiryDate: "1850730911",
    owner: {
      id: "0xa33ba7bf6f2343169de5a0496cd76da8839ea3e6",
    },
  };
  const expectedFunctionOutput: LatestRegistration = {
    name: "empireofthesun.eth",
    createdAt: 1644045472,
    expiryDate: 1850730911,
    owner: "0xa33ba7bf6f2343169de5a0496cd76da8839ea3e6",
  };

  it("should not include wrappedOwner if it's not included in the input", () => {
    const result = toLatestRegistration(latestRegistrationResultWithoutWrappedOwner);

    expect(result.wrappedOwner).toBeUndefined();
  });

  it("should include wrappedOwner if it's included in the input", () => {
    const result = toLatestRegistration(latestRegistrationResultWithWrappedOwner);

    expect(result.wrappedOwner).toBeDefined();
  });

  it("should return createdAt and expiryDate timestamps as numbers", () => {
    const result = toLatestRegistration(latestRegistrationResultWithoutWrappedOwner);

    expect(result.createdAt).toBeTypeOf("number");
    expect(result.expiryDate).toBeTypeOf("number");
  });

  it("should not change explicit values of any field", () => {
    const result = toLatestRegistration(latestRegistrationResultWithoutWrappedOwner);

    expect(result).toStrictEqual(expectedFunctionOutput);
  });
});
