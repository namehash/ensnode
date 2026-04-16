import { ens_normalize } from "@adraffy/ens-normalize";

import type { InterpretedLabel, InterpretedName, Label, Name } from "./types";

/**
 * Normalizes a Name according to ENS normalization rules (ENSIP-15), returning an InterpretedName.
 *
 * @throws if the Name is not normalizable
 * @see https://docs.ens.domains/ensip/15
 */
export const normalizeName = (name: Name): InterpretedName => {
  try {
    return ens_normalize(name) as InterpretedName;
  } catch (cause) {
    throw new Error(`Name '${name}' cannot be normalized.`, { cause });
  }
};

/**
 * Normalizes a Label according to ENS normalization rules (ENSIP-15), returning an InterpretedLabel.
 *
 * @throws if the Label is not normalizable
 * @see https://docs.ens.domains/ensip/15
 */
export const normalizeLabel = (label: Label): InterpretedLabel => {
  // empty string cannot be a normalized label
  if (label === "") throw new Error("Label is empty ('') and cannot be normalized.");

  // normalized labels do not contain periods
  if (label.includes(".")) {
    throw new Error(`Label '${label}' includes '.' and cannot be normalized.`);
  }

  try {
    // NOTE: the ens_normalize function accepts _names_ not labels, and so we must include our own
    // invariants above to ensure that the `label` input here can be safely normalized
    return ens_normalize(label) as InterpretedLabel;
  } catch (cause) {
    throw new Error(`Label '${label}' cannot be normalized.`, { cause });
  }
};

/**
 * Determines whether the Name is normalized according to ENSIP-15 normalization rules.
 */
export function isNormalizedName(name: Name): boolean {
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
