import { labelhash as labelToLabelHash } from "viem";

import {
  encodeLabelHash,
  type InterpretedLabel,
  type InterpretedName,
  isEncodedLabelHash,
  isNormalizedLabel,
} from "../ens";

/**
 * Reinterpret Label
 *
 * Reinterprets {@link InterpretedLabel} values received by "External System"
 * into  {@link InterpretedLabel} values in "Internal System" where:
 * 1. "External System" is not guaranteed to be using the same ENSNormalize
 *    version as "Internal System", and therefore the `InterpretedLabel` passed into
 *    this function (from "External System") is not guaranteed to 100% align
 *    with the invariants of an `InterpretedLabel` in "Internal System".
 * 2. The `InterpretedLabel` returned by this function is guaranteed to match
 *    the invariants of `InterpretedLabel` in "Internal System".
 *
 * @returns reinterpreted label.
 * @throws an error if the provided label is an empty label
 *         (and therefore violates the invariants of an InterpretedLabel).
 */
export function reinterpretLabel(label: InterpretedLabel): InterpretedLabel {
  // Invariant: InterpretedLabel value must never be an empty label.
  if (label === "") {
    throw new Error(
      `Cannot reinterpret an empty label that violates the invariants of an InterpretedLabel.`,
    );
  }

  // no change required for EncodedLabelHash
  if (isEncodedLabelHash(label)) return label;

  // no change required for NormalizedLabel
  if (isNormalizedLabel(label)) return label;

  // the provided `label` is unnormalized,
  // turn into an EncodedLabelHash
  return encodeLabelHash(labelToLabelHash(label)) as InterpretedLabel;
}

/**
 * Reinterpret Name
 *
 * Reinterprets {@link InterpretedName} values received by "External System"
 * into  {@link InterpretedName} values in "Internal System" where:
 * 1. "External System" is not guaranteed to be using the same ENSNormalize
 *    version as "Internal System", and therefore the `InterpretedName` passed into
 *    this function (from "External System") is not guaranteed to 100% align
 *    with the invariants of an `InterpretedName` in "Internal System".
 * 2. The `InterpretedName` returned by this function is guaranteed to match
 *    the invariants of `InterpretedName` in "Internal System".
 */
export function reinterpretName(name: InterpretedName): InterpretedName {
  if (name === "") return name;

  const interpretedLabels = name.split(".") as InterpretedLabel[];
  const reinterpretedLabels = interpretedLabels.map(reinterpretLabel);
  const reinterpretedName = reinterpretedLabels.join(".") as InterpretedName;

  return reinterpretedName;
}
