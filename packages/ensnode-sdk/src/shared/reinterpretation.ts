import { labelhash as labelToLabelHash } from "viem";

import {
  encodeLabelHash,
  type InterpretedLabel,
  type InterpretedName,
  isNormalizedLabel,
  type Label,
} from "../ens";

/**
 * Reinterpret Label
 *
 * @returns reinterpreted label.
 * @throws an error when the provided label must never be an empty label.
 */
export function reinterpretLabel(label: Label): InterpretedLabel {
  // Invariant: the provided label must never be an empty label.
  if (label === "") {
    throw new Error(`The label must not be an empty string to be reinterpreted.`);
  }

  // no change required for NormalizedLabel
  if (isNormalizedLabel(label)) return label as InterpretedLabel;

  // the provided `label` is unnormalized,
  // turn in into EncodedLabelHash
  return encodeLabelHash(labelToLabelHash(label)) as InterpretedLabel;
}

/**
 * Reinterpret Name
 *
 * Reinterprets {@link InterpretedName} values received by "External System"
 * into  {@link InterpretedName} values in "Internal System" where:
 * 1. "External System" is not guaranteed to be using the same ENSNormalize
 *    version as "Internal System", and therefore the `Name` passed into
 *    this function (from "External System") is not guaranteed to 100% align
 *    with the invariants of an `InterpretedName` in "Internal System".
 * 2. The `InterpretedName` returned by this function is guaranteed to match
 *    the invariants of `InterpretedName` in "Internal System".
 */
export function reinterpretName(name: InterpretedName): InterpretedName {
  if (name === "") return name as InterpretedName;

  const labels = name.split(".");
  const reinterpretedLabels = labels.map(reinterpretLabel);
  const reinterpretedName = reinterpretedLabels.join(".") as InterpretedName;

  return reinterpretedName;
}
