import {
  addrReverseLabel,
  type InterpretedLabel,
  labelhashInterpretedLabel,
  labelhashLiteralLabel,
  toNormalizedAddress,
} from "enssdk";
import { describe, expect, it } from "vitest";

import { maybeHealLabelByAddrReverseSubname } from "./maybe-heal-label-by-addr-reverse-subname";

const address = toNormalizedAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");

describe("maybeHealLabelByAddrReverseSubname", () => {
  const reverseAddressSubname = addrReverseLabel(address);
  const labelHash = labelhashLiteralLabel(reverseAddressSubname);
  const notMatchingLabelHash = labelhashInterpretedLabel("test.eth" as InterpretedLabel);

  it("should return null if the label cannot be healed", () => {
    expect(maybeHealLabelByAddrReverseSubname(notMatchingLabelHash, address)).toBe(null);
  });

  it("should return the label if the label can be healed", () => {
    expect(maybeHealLabelByAddrReverseSubname(labelHash, address)).toBe(reverseAddressSubname);
  });
});
