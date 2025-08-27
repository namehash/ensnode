import { labelhash, normalize } from "viem/ens";

import type { EncodedLabelHash, Label, LabelHash, Name } from "../ens";

/**
 * Determines whether the input Name or Label is normalized.
 *
 * @param input - The Name or Label string to check for normalization
 * @returns True if the input is normalized according to ENS normalization rules, false otherwise
 */
export function isNormalized(input: Name | Label) {
  try {
    return input === normalize(input);
  } catch {
    return false;
  }
}

/**
 * Represents a LabelHash as an Encoded LabelHash.
 *
 * @param labelHash - A 32-byte hash string starting with '0x'
 * @returns The encoded label hash in format `[hash_without_0x_prefix]`
 * @throws Error if labelHash doesn't start with '0x' or doesn't have length 66
 */
export function encodeLabelHash(labelHash: LabelHash): EncodedLabelHash {
  if (!labelHash.startsWith("0x")) throw new Error("Expected labelhash to start with 0x");
  if (labelHash.length !== 66) throw new Error("Expected labelhash to have a length of 66");

  return `[${labelHash.slice(2)}]`;
}

/**
 * Processes a Label, ensuring that it is either:
 * a) invalid: null, or
 * b) valid: normalized or represented as an Encoded LabelHash
 *
 * @param label - The label string to validate, or null
 * @returns A valid normalized Label, an EncodedLabelHash if the label contains dots or isn't normalized, or null if invalid
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
 * a) invalid: null, or
 * b) valid: composed entirely of valid Labels (Labels that are normalized or an Encoded LabelHash).
 *
 * @param name - The ENS name string to validate, or null
 * @returns A valid Name composed of valid labels, or null if any label is invalid
 */
export function validNameOrNull(name: string | null): Name | null {
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
 * Processes the provided name record `value`, ensuring that it is either:
 * a) invalid: null, or
 * b) valid: a normalized, non-empty-string Name.
 *
 * @param value - The name record value string to validate
 * @returns A valid normalized Name for use as a name record, or null if invalid (empty string or not normalized)
 */
export function validNameRecordOrNull(value: string): Name | null {
  // empty string is technically a normalized name, representing the ens root node, but in the
  // context of a name record value, we want to coerce empty string to null, to represent the
  // non-existence of a record value.
  if (value === "") return null;

  // if not normalized, is not valid `name` record value
  if (!isNormalized(value)) return null;

  // otherwise, this is a non-empty-string normalized Name that can be used as a name() record value
  return value as Name;
}
