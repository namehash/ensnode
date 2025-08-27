import { normalize } from "viem/ens";

import type { Label, Name } from "./types";

/**
 * Determines whether the input Name is normalized.
 *
 * @param input - The Name string to check for normalization
 * @returns True if the input is a normalized Name according to ENS normalization rules, false otherwise
 */
export function isNormalizedName(input: string): input is Name {
  try {
    return input === normalize(input);
  } catch {
    return false;
  }
}

/**
 * Determines whether the input Label is normalized.
 *
 * @param input - The Label string to check for normalization
 * @returns True if the input is a normalized Label according to ENS normalization rules, false otherwise
 */
export function isNormalizedLabel(input: string): input is Label {
  // normalized labels do not contain periods
  if (input.includes(".")) return false;

  try {
    return input === normalize(input);
  } catch {
    return false;
  }
}
