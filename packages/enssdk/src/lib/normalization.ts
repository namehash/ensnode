import { ens_normalize } from "@adraffy/ens-normalize";

import type { InterpretedLabel, InterpretedName, Label, Name, NormalizedName } from "./types";

/**
 * Normalizes a Name according to ENS normalization rules (ENSIP-15), returning an InterpretedName.
 *
 * @throws if the Name is not normalizable
 * @see https://docs.ens.domains/ensip/15
 */
export const normalizeName = (name: Name): InterpretedName =>
  ens_normalize(name) as InterpretedName;

/**
 * Normalizes a Label according to ENS normalization rules (ENSIP-15), returning an InterpretedLabel.
 *
 * @throws if the Label is not normalizable
 * @see https://docs.ens.domains/ensip/15
 */
export const normalizeLabel = (label: Label): InterpretedLabel => {
  // empty string cannot be a label
  if (label === "") throw new Error("Empty string is not a valid Label.");

  // normalized labels do not contain periods
  if (label.includes(".")) {
    throw new Error(`Label '${label}' includes '.' and cannot be normalized.`);
  }

  // NOTE: the ens_normalize function accepts _names_ not labels, and so we must include our own
  // invariants above to ensure that the `label` input here can be safely normalized
  return ens_normalize(label) as InterpretedLabel;
};

/**
 * Determines whether the Name is normalized according to ENSIP-15 normalization rules.
 */
export function isNormalizedName(name: Name): name is NormalizedName {
  try {
    return name === normalizeName(name);
  } catch {
    return false;
  }
}
/**
 * Determines whether the Label is normalized according to ENSIP-15 normalization rules.
 */
export function isNormalizedLabel(label: Label): boolean {
  try {
    return label === normalizeLabel(label);
  } catch {
    return false;
  }
}
