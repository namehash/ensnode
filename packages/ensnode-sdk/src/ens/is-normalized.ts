import { normalize } from "viem/ens";

import type { Label, Name, NormalizedName } from "./types";

/**
 * Determines whether the Name is normalized.
 *
 * @param name - The Name to check for normalization
 * @returns True if the name is normalized according to ENS normalization rules, false otherwise
 */
export function isNormalizedName(name: Name): name is NormalizedName {
  try {
    return name === normalize(name);
  } catch {
    return false;
  }
}

/**
 * Determines whether the Label is normalized.
 *
 * @param label - The Label to check for normalization
 * @returns True if the label is normalized according to ENS normalization rules, false otherwise
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
