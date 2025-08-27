import { labelhash, normalize } from "viem/ens";

import type { EncodedLabelHash, Label, LabelHash, Name } from "../ens";

export function isNormalized(name: Name) {
  try {
    return name === normalize(name);
  } catch {
    return false;
  }
}

export function encodeLabelHash(labelHash: LabelHash): EncodedLabelHash {
  if (!labelHash.startsWith("0x")) throw new Error("Expected labelhash to start with 0x");
  if (labelHash.length !== 66) throw new Error("Expected labelhash to have a length of 66");

  return `[${labelHash.slice(2)}]`;
}

/**
 * Processes a Label, ensuring that it is either:
 * a) an invalid label (null),
 * b) normalized, or
 * c) represented as an Encoded LabelHash.
 */
export function validLabelOrNull(label: string | null): Label | EncodedLabelHash | null {
  // obviously null is invalid — it's helpful to embed this logic here to streamline the coalescing
  // pattern at this method's callsites, minimizing hard-to-read ternary statements.
  if (label === null) return null;

  // empty string is an invalid Label
  if (label === "") return null;

  // if the label contains '.' or is not normalized, represent as encoded LabelHash
  if (label.includes(".") || !isNormalized(label)) return encodeLabelHash(labelhash(label));

  // otherwise, the label is normalized and doesn't contain '.'
  return label as Label;
}

/**
 * Processes a Name value, ensuring that it is either:
 * a) an invalid Name (null), or
 * b) composed entirely of Labels that are either:
 *   i. normalized, or
 *   ii. Encoded LabelHashes
 */
export function normalizedNameOrWithEncodedLabelHash(name: string | null): Name | null {
  // obviously null is invalid — it's helpful to embed this logic here to streamline the coalescing
  // pattern at this method's callsites, minimizing hard-to-read ternary statements.
  if (name === null) return null;

  const labels = name.split(".").map(validLabelOrNull);

  // if any of the labels resulted in null (were not valid, for whatever reason, this name is not valid)
  if (labels.some((label) => label === null)) return null;

  // otherwise the name is composed of non-empty labels adhering to `validLabelOrNull` guarantees
  return labels.join(".") as Name;
}

/**
 * Interprets the provided name record `value` as either:
 * a) a normalized, non-empty-string Name
 * b) or null.
 */
export function validNameRecordOrNull(value: string): Name | null {
  // empty string is technically a normalized name, representing the ens root node, but in the
  // context of a name record value, we want to coerce empty string to null, to represent the
  // non-existence of a record value, so we check for it here
  if (value === "") return null;

  // if not normalized, is not valid `name` record value
  if (!isNormalized(value)) return null;

  return value as Name;
}
