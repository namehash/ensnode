import { keccak256, stringToBytes } from "viem";
import { LabelHash, LiteralLabel } from "../ens";

/**
 * Implements the ENS `labelhash` function for Literal Labels.
 * @see https://docs.ens.domains/ensip/1
 *
 * @param label the Literal Label to hash
 * @returns the hash of the provided label
 * @dev This function is viem/ens#labelhash but without the special-case handling of Encoded LabelHashes.
 */
export const labelhashLiteralLabel = (label: LiteralLabel): LabelHash =>
  keccak256(stringToBytes(label));
