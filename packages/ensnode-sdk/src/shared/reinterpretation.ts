import {
  type EncodedLabelHash,
  encodeLabelHash,
  isEncodedLabelHash,
  isLabelHash,
  isNormalizedLabel,
  type Label,
  type LabelHash,
  LiteralLabel,
  type Name,
} from "../ens";

/**
 * Reinterpreted Label
 *
 * Guarantees:
 * - Non empty
 * - If label is a {@link LiteralLabel}, then it was mapped into
 *   {@link EncodedLabelHash}.
 */
export type ReinterpretedLabel = Label | EncodedLabelHash;

/**
 * Reinterpreted Name
 *
 * A Name built only from {@link ReinterpretedLabel}s.
 */
export type ReinterpretedName = Name;

/**
 * Reinterpret Label
 */
export function reinterpretLabel(label: Label | LabelHash): Label | LabelHash {
  // a LabelHash must be encoded
  if (isLabelHash(label)) return encodeLabelHash(label);

  // no change required for EncodedLabelHash
  if (isEncodedLabelHash(label)) return label;

  // no change required for NormalizedLabel
  if (isNormalizedLabel(label)) return label;

  // otherwise, label cannot be reinterpreted
  throw new Error(
    `The '${label}' label must be either a NormalizedLabel, EncodedLabelHash, or LabelHash to be reinterpreted.`,
  );
}

/**
 * Reinterpret Name
 *
 * Allows the ENSNode Client to reinterpret Names returned from ENSApi.
 */
export function reinterpretName(name: Name): ReinterpretedName {
  if (name === "") return name;

  const labels = name.split(".");

  if (labels.some((l) => l === "")) {
    throw new Error("Name must not include empty labels.");
  }

  return labels.map(reinterpretLabel).join(".");
}
