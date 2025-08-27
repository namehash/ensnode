import { labelhash, normalize } from "viem/ens";

import type { EncodedLabelHash, Label, Name } from "../ens";

export function isNormalized(name: Name) {
  try {
    return name === normalize(name);
  } catch {
    return false;
  }
}

/**
 * Processes a Label, ensuring that it is either:
 * a) an invalid label (null),
 * b) normalized, or
 * c) represented as an Encoded LabelHash.
 *
 * @param label
 * @returns
 */
export function normalizedLabelOrEncodedLabelHash(label: string): Label | EncodedLabelHash | null {
  // empty string is an invalid Label
  if (label === "") return null;

  // if the label contains '.' or is not normalized, represent as encoded LabelHash
  if (label.includes(".") || !isNormalized(label)) {
    // note: lowercase/length/etc checks are not necessary — `labelhash` is well-behaved
    return `[${labelhash(label).slice(2)}]` as EncodedLabelHash;
  }

  // otherwise, the label is normalized and doesn't contain '.'
  return label as Label;
}

/**
 * Interprets the provided name record `value` as a normalized, non-empty string or null.
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
