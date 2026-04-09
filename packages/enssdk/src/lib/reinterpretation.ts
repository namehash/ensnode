import {
  asInterpretedLabel,
  asLiteralLabel,
  interpretedLabelsToInterpretedName,
  interpretedNameToInterpretedLabels,
} from "./interpreted-names-and-labels";
import { encodeLabelHash, isEncodedLabelHash, labelhashLiteralLabel } from "./labelhash";
import { isNormalizedLabel } from "./normalization";
import type { InterpretedLabel, InterpretedName } from "./types";

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

  // the provided `label` is an unnormalized literal label, encode it
  const labelHash = labelhashLiteralLabel(asLiteralLabel(label as string));
  return asInterpretedLabel(encodeLabelHash(labelHash));
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

  const labels = interpretedNameToInterpretedLabels(name);
  return interpretedLabelsToInterpretedName(labels.map(reinterpretLabel));
}
