import { normalize } from "viem/ens";

import type { Label, Name } from "./types";

/**
 * Determines whether the input Name is normalized.
 *
 * @param name - The Name to check for normalization
 * @returns True if the input is a normalized Name according to ENS normalization rules, false otherwise
 */
export function isNormalizedName(name: Name): boolean {
  try {
    return name === normalize(name);
  } catch {
    return false;
  }
}

/**
 * Determines whether the input Label is normalized.
 *
 * @param label - The Label to check for normalization
 * @returns True if the input is a normalized Label according to ENS normalization rules, false otherwise
 */
export function isNormalizedLabel(label: Label): boolean {
  // empty string is not a normalized label
  if (label === "") return false;

  // normalized labels do not contain periods
  if (label.includes(".")) return false;

  try {
    return label === normalize(label);
  } catch {
    return false;
  }
}
