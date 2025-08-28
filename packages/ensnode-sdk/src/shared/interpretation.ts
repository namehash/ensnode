import { labelhash } from "viem";

import {
  type EncodedLabelHash,
  type Label,
  type Name,
  encodeLabelHash,
  isNormalizedLabel,
  isNormalizedName,
} from "../ens";

/**
 * Interprets a Literal Label into an Interpreted Label or null if the Literal Label is null, empty
 * string, or not normalized.
 *
 * @see https://ensnode.io/docs/reference/terminology#literal-label
 * @see https://ensnode.io/docs/reference/terminology#interpreted-label
 *
 * @param label - The Literal Label string to validate
 * @returns An Interpreted Label or null if the Literal Label is null, empty string, or not normalized.
 */
export function interpretLiteralLabel(label: string | null): Label | EncodedLabelHash | null {
  // obviously null is invalid — it's helpful to embed this logic here to streamline the coalescing
  // pattern at this method's callsites, minimizing hard-to-read ternary statements.
  if (label === null) return null;

  // if the label is not normalized, represent as encoded LabelHash
  if (!isNormalizedLabel(label)) return encodeLabelHash(labelhash(label));

  // otherwise, the label is normalized
  return label as Label;
}

/**
 * Interprets a Literal Name value into an Interpreted Name or null, if the Literal Name is null or
 * composed of un-interpretable Labels.
 *
 * @see https://ensnode.io/docs/reference/terminology#literal-name
 * @see https://ensnode.io/docs/reference/terminology#interpreted-name
 *
 * @param name - The ENS name string to validate
 * @returns An Interpreted Name that is either normalized or consists entirely of Interpreted Labels
 */
export function interpretLiteralName(name: string | null): Name | null {
  // obviously null is invalid — it's helpful to embed this logic here to streamline the coalescing
  // pattern at this method's callsites, minimizing hard-to-read ternary statements.
  if (name === null) return null;

  // if the name is already normalized (includes empty string), good to go
  if (isNormalizedName(name)) return name as Name;

  const labels = name.split(".").map(interpretLiteralLabel);

  // if any of the labels resulted in null (were not valid, for whatever reason, this name is not valid)
  if (labels.some((label) => label === null)) return null;

  // otherwise the name is composed of Interpreted Labels and is an Interpreted Name
  return labels.join(".") as Name;
}

/**
 * Interprets the provided name record value, ensuring that it is either:
 * a) null, or
 * b) a normalized, non-empty-string Name.
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
  if (!isNormalizedName(value)) return null;

  // otherwise, this is a non-empty-string normalized Name that can be used as a name() record value
  return value as Name;
}
