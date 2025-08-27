import { normalize } from "viem/ens";

import type { Label, Name } from "./types";

/**
 * Determines whether the input Name or Label is normalized.
 *
 * @param input - The Name or Label string to check for normalization
 * @returns True if the input is normalized according to ENS normalization rules, false otherwise
 */
export function isNormalized(input: Name | Label) {
  try {
    return input === normalize(input);
  } catch {
    return false;
  }
}
