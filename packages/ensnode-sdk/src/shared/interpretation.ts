import { labelhash } from "viem";

import {
  type EncodedLabelHash,
  type Label,
  type Name,
  encodeLabelHash,
  isNormalized,
} from "../ens";

/**
 * Interprets a Label, ensuring that it is either:
 * a) invalid: null, or
 * b) valid: normalized or represented as an Encoded LabelHash
 *
 * @param label - The label string to validate, or null
 * @returns A valid normalized Label, an EncodedLabelHash if the label contains dots or isn't normalized, or null if invalid
 */
export function interpretLabel(label: string | null): Label | EncodedLabelHash | null {
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
 * Interprets a Name value, ensuring that it is either:
 * a) invalid: null, or
 * b) valid: composed entirely of valid Labels (Labels that are normalized or an Encoded LabelHash).
 *
 * @param name - The ENS name string to validate, or null
 * @returns A valid Name composed of valid labels, or null if any label is invalid
 */
export function interpretName(name: string | null): Name | null {
  // obviously null is invalid — it's helpful to embed this logic here to streamline the coalescing
  // pattern at this method's callsites, minimizing hard-to-read ternary statements.
  if (name === null) return null;

  const labels = name.split(".").map(interpretLabel);

  // if any of the labels resulted in null (were not valid, for whatever reason, this name is not valid)
  if (labels.some((label) => label === null)) return null;

  // otherwise the name is composed of non-empty labels adhering to `validLabelOrNull` guarantees
  return labels.join(".") as Name;
}

/**
 * Interprets the provided name record value, ensuring that it is either:
 * a) invalid: null, or
 * b) valid: a normalized, non-empty-string Name.
 *
 * @param value - The name record value string to validate
 * @returns A valid normalized Name for use as a name record, or null if invalid (empty string or not normalized)
 */
export function interpretNameRecord(value: string): Name | null {
  // empty string is technically a normalized name, representing the ens root node, but in the
  // context of a name record value, we want to coerce empty string to null, to represent the
  // non-existence of a record value.
  if (value === "") return null;

  // if not normalized, is not valid `name` record value
  if (!isNormalized(value)) return null;

  // otherwise, this is a non-empty-string normalized Name that can be used as a name() record value
  return value as Name;
}
