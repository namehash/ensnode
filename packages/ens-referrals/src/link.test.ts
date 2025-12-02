import { type Address, getAddress } from "viem";
import { describe, expect, it } from "vitest";

import { buildEnsReferralUrl } from "./link";

const vitalikEthAddressLowercase: Address = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
const vitalikEthAddressChecksummed: Address = getAddress(
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
);
const expectedUrlString = `https://app.ens.domains/?referrer=${vitalikEthAddressChecksummed}`;

describe("buildEnsReferralUrl", () => {
  it("can build referrer URL to ENS App when given a lowercase address", () => {
    expect(buildEnsReferralUrl(vitalikEthAddressLowercase).toString()).toStrictEqual(
      expectedUrlString,
    );
  });

  it("can build referrer URL to ENS App when given a checksummed address", () => {
    expect(buildEnsReferralUrl(vitalikEthAddressChecksummed).toString()).toStrictEqual(
      expectedUrlString,
    );
  });
});
