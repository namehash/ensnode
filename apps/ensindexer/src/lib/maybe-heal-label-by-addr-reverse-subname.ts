import type { Address } from "viem";

import {
  addrReverseLabel,
  type LabelHash,
  type LiteralLabel,
  labelhashLiteralLabel,
} from "@ensnode/ensnode-sdk";

/**
 * Attempt to heal the labelHash of an addr.reverse subname using an address.
 *
 * @returns the label if healed, otherwise null
 */
export const maybeHealLabelByAddrReverseSubname = (
  labelHash: LabelHash,
  address: Address,
): LiteralLabel | null => {
  // construct an addr.reverse subname label from the provided address
  const maybeLabel = addrReverseLabel(address);

  // if its labelhash matches what we're looking for, then that was the label
  if (labelhashLiteralLabel(maybeLabel) === labelHash) return maybeLabel;

  // otherwise, healing did not succeed
  return null;
};
