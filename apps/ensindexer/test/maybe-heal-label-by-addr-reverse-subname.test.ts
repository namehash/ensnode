import { addrReverseLabel } from "@ensnode/ensnode-sdk";
import { Address, labelhash } from "viem";
import { describe, expect, it } from "vitest";

import { maybeHealLabelByAddrReverseSubname } from "@/lib/maybe-heal-label-by-addr-reverse-subname";

describe("maybeHealLabelByAddrReverseSubname", () => {
  const address: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  const reverseAddressSubname = addrReverseLabel(address);
  const labelHash = labelhash(reverseAddressSubname);
  const notMatchingLabelHash = labelhash("test.eth");

  it("should return null if the label cannot be healed", () => {
    expect(maybeHealLabelByAddrReverseSubname(notMatchingLabelHash, address)).toBe(null);
  });

  it("should return the label if the label can be healed", () => {
    expect(maybeHealLabelByAddrReverseSubname(labelHash, address)).toBe(reverseAddressSubname);
  });
});
