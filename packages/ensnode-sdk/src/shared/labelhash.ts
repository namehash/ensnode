import { keccak256, stringToBytes, zeroHash } from "viem";
import { LabelHash, LiteralLabel } from "../ens";

/**
 * Implements the ENS `labelhash` function for Literal Labels.
 * @see https://docs.ens.domains/ensip/1
 *
 * NOTE: This function is viem/ens#labelhash but without the special-case handling of Encoded LabelHashes.
 *
 * @param label the Literal Label to hash
 * @returns the hash of the provided label
 */
export function labelhashLiteralLabel(label: LiteralLabel): LabelHash {
  // the labelhash of the empty string is zeroHash
  if (label === "") return zeroHash;

  // otherwise, keccak256 the label bytes
  return keccak256(stringToBytes(label));
}
